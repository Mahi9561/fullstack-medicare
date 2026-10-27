import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/fields';
import { useToast } from '../../components/ui/Toast';
import { medicalRecordApi } from '../../services/medicalRecord.api';
import { RECORD_TYPES, type MedicalRecord } from '../../types';
import { errorMessage } from '../../utils/errors';
import { recordTypeLabel, todayISO } from '../../utils/format';

const schema = z.object({
  title: z.string().trim().min(1, 'Enter a title').max(200),
  record_type: z.enum(['LAB_REPORT', 'IMAGING', 'VACCINATION', 'ALLERGY', 'PROCEDURE', 'OTHER']),
  record_date: z
    .string()
    .min(1, 'Choose a date')
    .refine((value) => value <= todayISO(), 'The date cannot be in the future'),
  description: z.string().trim().min(1, 'Describe the entry').max(5000),
});

type FormValues = z.infer<typeof schema>;

interface MedicalRecordFormProps {
  patientId: number;
  onSaved: (record: MedicalRecord) => void;
  onCancel: () => void;
}

export function MedicalRecordForm({ patientId, onSaved, onCancel }: MedicalRecordFormProps) {
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', record_type: 'LAB_REPORT', record_date: todayISO(), description: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const saved = await medicalRecordApi.create({ patient_id: patientId, ...values });
      toast.success('Record added');
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
      <Input label="Title" placeholder="For example: Complete blood count" error={errors.title?.message} {...register('title')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Type" error={errors.record_type?.message} {...register('record_type')}>
          {RECORD_TYPES.map((type) => (
            <option key={type} value={type}>
              {recordTypeLabel(type)}
            </option>
          ))}
        </Select>
        <Input label="Date" type="date" max={todayISO()} error={errors.record_date?.message} {...register('record_date')} />
      </div>
      <Textarea label="Details" rows={4} error={errors.description?.message} {...register('description')} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Add record
        </Button>
      </div>
    </form>
  );
}
