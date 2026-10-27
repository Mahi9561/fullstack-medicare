import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useFieldArray, useForm, type FieldPath } from 'react-hook-form';
import { z } from 'zod';
import { ErrorNote } from '../../components/common/ErrorNote';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/fields';
import { useToast } from '../../components/ui/Toast';
import { useAsync } from '../../hooks/useAsync';
import { medicationApi } from '../../services/medication.api';
import { prescriptionApi } from '../../services/prescription.api';
import type { Prescription } from '../../types';
import { errorMessage, fieldErrorsOf } from '../../utils/errors';
import { blankToNull } from '../../utils/format';

const itemSchema = z.object({
  medication_id: z.number({ invalid_type_error: 'Choose a medicine' }).int().positive('Choose a medicine'),
  dosage: z.string().trim().min(1, 'Enter a dosage').max(100),
  frequency: z.string().trim().min(1, 'Enter how often').max(100),
  duration_days: z.number({ invalid_type_error: 'Enter days' }).int('Whole days only').min(1, 'At least 1 day').max(365, 'At most 365 days'),
  instructions: z.string().trim().max(255).optional(),
});

const schema = z
  .object({
    notes: z.string().trim().max(2000).optional(),
    items: z.array(itemSchema).min(1, 'Add at least one medicine').max(20, 'At most 20 medicines'),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<number>();
    value.items.forEach((item, index) => {
      if (seen.has(item.medication_id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'This medicine is already on the list', path: ['items', index, 'medication_id'] });
      }
      seen.add(item.medication_id);
    });
  });

type FormValues = z.infer<typeof schema>;

// medication_id starts undefined (not NaN) so the select shows its "Select" placeholder; the schema still rejects it.
const blankItem = (): FormValues['items'][number] => ({
  medication_id: undefined as unknown as number,
  dosage: '',
  frequency: '',
  duration_days: 5,
  instructions: '',
});

interface PrescriptionBuilderProps {
  consultationId: number;
  /** When given, the builder edits this prescription (replacing its items) instead of creating one. */
  existing?: Prescription | null;
  onSaved: (prescription: Prescription) => void;
}

export function PrescriptionBuilder({ consultationId, existing = null, onSaved }: PrescriptionBuilderProps) {
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  // The API caps page size at 50, which comfortably covers the clinic formulary.
  const medications = useAsync(() => medicationApi.list({ active: true, limit: 50 }), []);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      notes: existing?.notes ?? '',
      items:
        existing?.items && existing.items.length > 0
          ? existing.items.map((item) => ({
              medication_id: item.medication_id,
              dosage: item.dosage,
              frequency: item.frequency,
              duration_days: item.duration_days,
              instructions: item.instructions ?? '',
            }))
          : [blankItem()],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const body = {
      notes: blankToNull(values.notes),
      items: values.items.map((item) => ({ ...item, instructions: blankToNull(item.instructions) })),
    };
    try {
      const saved = existing
        ? await prescriptionApi.update(existing.id, body)
        : await prescriptionApi.create({ consultation_id: consultationId, ...body });
      toast.success(existing ? 'Prescription updated' : 'Prescription issued');
      onSaved(saved);
    } catch (error) {
      for (const [field, message] of Object.entries(fieldErrorsOf(error))) {
        setError(field as FieldPath<FormValues>, { message });
      }
      setFormError(errorMessage(error));
    }
  });

  const options = medications.data?.items ?? [];

  return (
    <form onSubmit={onSubmit} noValidate>
      {medications.error && <ErrorNote message={medications.error} onRetry={medications.reload} />}
      {formError && (
        <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {formError}
        </p>
      )}

      <ol className="space-y-4">
        {fields.map((field, index) => {
          const itemErrors = errors.items?.[index];
          return (
            <li key={field.id} className="rounded-md border border-rule p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium">Medicine {index + 1}</p>
                {fields.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => remove(index)}>
                    Remove
                  </Button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-6">
                <Select
                  label="Medicine"
                  wrapperClassName="sm:col-span-3"
                  error={itemErrors?.medication_id?.message}
                  {...register(`items.${index}.medication_id`, { valueAsNumber: true })}
                >
                  <option value="" disabled>
                    Select
                  </option>
                  {options.map((medication) => (
                    <option key={medication.id} value={medication.id}>
                      {medication.name}
                    </option>
                  ))}
                </Select>
                <Input label="Dosage" wrapperClassName="sm:col-span-3" placeholder="1 tablet" error={itemErrors?.dosage?.message} {...register(`items.${index}.dosage`)} />
                <Input label="How often" wrapperClassName="sm:col-span-3" placeholder="Twice a day, after food" error={itemErrors?.frequency?.message} {...register(`items.${index}.frequency`)} />
                <Input
                  label="Days"
                  type="number"
                  min={1}
                  max={365}
                  wrapperClassName="sm:col-span-1"
                  error={itemErrors?.duration_days?.message}
                  {...register(`items.${index}.duration_days`, { valueAsNumber: true })}
                />
                <Input label="Instructions (optional)" wrapperClassName="sm:col-span-6" error={itemErrors?.instructions?.message} {...register(`items.${index}.instructions`)} />
              </div>
            </li>
          );
        })}
      </ol>
      {errors.items?.root?.message && (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {errors.items.root.message}
        </p>
      )}
      {typeof errors.items?.message === 'string' && (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {errors.items.message}
        </p>
      )}

      <div className="mt-3">
        <Button variant="secondary" size="sm" onClick={() => append(blankItem())} disabled={fields.length >= 20}>
          Add another medicine
        </Button>
      </div>

      <Textarea label="Notes for the patient (optional)" rows={2} wrapperClassName="mt-5" error={errors.notes?.message} {...register('notes')} />

      <div className="mt-5">
        <Button type="submit" loading={isSubmitting}>
          {existing ? 'Update prescription' : 'Issue prescription'}
        </Button>
      </div>
    </form>
  );
}
