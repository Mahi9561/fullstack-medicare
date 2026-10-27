import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ErrorNote } from '../../components/common/ErrorNote';
import { Button } from '../../components/ui/Button';
import { Checkbox, Input, Textarea } from '../../components/ui/fields';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { useAsync } from '../../hooks/useAsync';
import { adminApi } from '../../services/admin.api';
import { departmentApi } from '../../services/department.api';
import type { DoctorProfile } from '../../types';
import { errorMessage, fieldErrorsOf } from '../../utils/errors';
import { blankToNull } from '../../utils/format';

/** Email and password only exist when creating; editing never touches credentials. */
const buildSchema = (editing: boolean) =>
  z.object({
    email: editing ? z.string().optional() : z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
    password: editing
      ? z.string().optional()
      : z
          .string()
          .min(8, 'Use at least 8 characters')
          .max(72, 'At most 72 characters')
          .regex(/[A-Za-z]/, 'Include at least one letter')
          .regex(/\d/, 'Include at least one number'),
    first_name: z.string().trim().min(1, 'First name is required').max(100),
    last_name: z.string().trim().min(1, 'Last name is required').max(100),
    specialization: z.string().trim().min(1, 'Specialization is required').max(100),
    qualification: z.string().trim().min(1, 'Qualification is required').max(255),
    experience_years: z.number({ invalid_type_error: 'Enter a number' }).int('Whole years only').min(0, 'Cannot be negative').max(80, 'At most 80'),
    consultation_fee: z.number({ invalid_type_error: 'Enter a number' }).min(0, 'Cannot be negative').max(1_000_000, 'Too large'),
    bio: z.string().trim().max(2000).optional(),
  });

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

interface DoctorFormProps {
  doctor: DoctorProfile | null;
  onSaved: () => void;
  onCancel: () => void;
}

function DoctorForm({ doctor, onSaved, onCancel }: DoctorFormProps) {
  const toast = useToast();
  const editing = doctor !== null;
  const schema = useMemo(() => buildSchema(editing), [editing]);
  const departments = useAsync(() => departmentApi.list(), []);
  const [departmentIds, setDepartmentIds] = useState<number[]>((doctor?.departments ?? []).map((d) => d.id));
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: doctor?.email ?? '',
      password: '',
      first_name: doctor?.first_name ?? '',
      last_name: doctor?.last_name ?? '',
      specialization: doctor?.specialization ?? '',
      qualification: doctor?.qualification ?? '',
      experience_years: doctor?.experience_years ?? 0,
      consultation_fee: doctor?.consultation_fee ?? 500,
      bio: doctor?.bio ?? '',
    },
  });

  const toggleDepartment = (id: number, checked: boolean) =>
    setDepartmentIds((current) => (checked ? [...current, id] : current.filter((existing) => existing !== id)));

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const profile = {
      first_name: values.first_name,
      last_name: values.last_name,
      specialization: values.specialization,
      qualification: values.qualification,
      experience_years: values.experience_years,
      consultation_fee: values.consultation_fee,
      bio: blankToNull(values.bio),
      department_ids: departmentIds,
    };
    try {
      if (doctor) {
        await adminApi.updateDoctor(doctor.id, profile);
      } else {
        await adminApi.createDoctor({ ...profile, email: values.email ?? '', password: values.password ?? '' });
      }
      toast.success(doctor ? 'Doctor updated' : 'Doctor account created');
      onSaved();
    } catch (error) {
      for (const [field, message] of Object.entries(fieldErrorsOf(error))) {
        if (field in values) setError(field as keyof FormValues, { message });
      }
      setFormError(errorMessage(error));
    }
  });

  // Keep a doctor's current departments selectable even if one was deactivated since.
  const options = (departments.data ?? []).filter((d) => d.is_active || departmentIds.includes(d.id));

  return (
    <form onSubmit={onSubmit} noValidate>
      {formError && (
        <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {formError}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {editing ? (
          <Input label="Email" value={doctor?.email ?? ''} readOnly wrapperClassName="sm:col-span-2" hint="The sign-in name cannot be changed here." />
        ) : (
          <>
            <Input label="Email" type="email" autoComplete="off" error={errors.email?.message} {...register('email')} />
            <Input label="Temporary password" type="text" autoComplete="off" hint="Share it with the doctor. At least 8 characters, with a letter and a number." error={errors.password?.message} {...register('password')} />
          </>
        )}
        <Input label="First name" error={errors.first_name?.message} {...register('first_name')} />
        <Input label="Last name" error={errors.last_name?.message} {...register('last_name')} />
        <Input label="Specialization" error={errors.specialization?.message} {...register('specialization')} />
        <Input label="Qualification" error={errors.qualification?.message} {...register('qualification')} />
        <Input label="Years of experience" type="number" min={0} error={errors.experience_years?.message} {...register('experience_years', { valueAsNumber: true })} />
        <Input label="Consultation fee (INR)" type="number" min={0} step="50" error={errors.consultation_fee?.message} {...register('consultation_fee', { valueAsNumber: true })} />
        <Textarea label="Bio (optional)" rows={3} wrapperClassName="sm:col-span-2" error={errors.bio?.message} {...register('bio')} />
      </div>

      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-medium">Departments</legend>
        {departments.error && <ErrorNote message={departments.error} onRetry={departments.reload} />}
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((department) => (
            <Checkbox
              key={department.id}
              label={department.name}
              checked={departmentIds.includes(department.id)}
              onChange={(event) => toggleDepartment(department.id, event.target.checked)}
            />
          ))}
        </div>
      </fieldset>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {editing ? 'Save changes' : 'Create doctor'}
        </Button>
      </div>
    </form>
  );
}

interface DoctorFormModalProps {
  open: boolean;
  doctor: DoctorProfile | null;
  onClose: () => void;
  onSaved: () => void;
}

export function DoctorFormModal({ open, doctor, onClose, onSaved }: DoctorFormModalProps) {
  return (
    <Modal open={open} title={doctor ? 'Edit doctor' : 'Add a doctor'} size="lg" onClose={onClose}>
      <DoctorForm key={doctor?.id ?? 'new'} doctor={doctor} onSaved={onSaved} onCancel={onClose} />
    </Modal>
  );
}
