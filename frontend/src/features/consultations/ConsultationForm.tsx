import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/fields';
import { useToast } from '../../components/ui/Toast';
import { consultationApi } from '../../services/consultation.api';
import type { Consultation } from '../../types';
import { errorMessage } from '../../utils/errors';
import { blankToNull } from '../../utils/format';

const schema = z.object({
  symptoms: z.string().trim().min(1, 'Describe the symptoms').max(5000),
  diagnosis: z.string().trim().min(1, 'Enter a diagnosis').max(5000),
  notes: z.string().trim().max(5000).optional(),
});

type FormValues = z.infer<typeof schema>;

interface ConsultationFormProps {
  appointmentId: number;
  /** When given, the form edits this consultation instead of creating one. */
  existing?: Consultation | null;
  onSaved: (consultation: Consultation) => void;
  onCancel?: () => void;
}

export function ConsultationForm({ appointmentId, existing = null, onSaved, onCancel }: ConsultationFormProps) {
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { symptoms: existing?.symptoms ?? '', diagnosis: existing?.diagnosis ?? '', notes: existing?.notes ?? '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const body = { symptoms: values.symptoms, diagnosis: values.diagnosis, notes: blankToNull(values.notes) };
    try {
      const saved = existing
        ? await consultationApi.update(existing.id, body)
        : await consultationApi.create({ appointment_id: appointmentId, ...body });
      toast.success(existing ? 'Consultation updated' : 'Consultation saved. The appointment is now completed.');
      onSaved(saved);
    } catch (error) {
      setFormError(errorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {formError}
        </p>
      )}
      <Textarea label="Symptoms" rows={3} error={errors.symptoms?.message} {...register('symptoms')} />
      <Textarea label="Diagnosis" rows={3} error={errors.diagnosis?.message} {...register('diagnosis')} />
      <Textarea label="Notes (optional)" rows={3} hint="Advice, follow-up plans, anything the patient should remember." error={errors.notes?.message} {...register('notes')} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={isSubmitting}>
          {existing ? 'Save changes' : 'Save consultation'}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        {!existing && <p className="text-sm text-ink-soft">Saving completes this appointment.</p>}
      </div>
    </form>
  );
}
