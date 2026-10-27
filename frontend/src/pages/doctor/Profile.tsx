import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/fields';
import { Panel } from '../../components/ui/Panel';
import { useToast } from '../../components/ui/Toast';
import { updateDoctorProfile } from '../../features/user/userSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { DoctorProfile } from '../../types';
import { errorMessage, fieldErrorsOf } from '../../utils/errors';
import { blankToNull } from '../../utils/format';

const schema = z.object({
  first_name: z.string().trim().min(1, 'First name is required').max(100),
  last_name: z.string().trim().min(1, 'Last name is required').max(100),
  specialization: z.string().trim().min(1, 'Specialization is required').max(100),
  qualification: z.string().trim().min(1, 'Qualification is required').max(255),
  experience_years: z.number({ invalid_type_error: 'Enter a number' }).int('Whole years only').min(0, 'Cannot be negative').max(80, 'At most 80'),
  consultation_fee: z.number({ invalid_type_error: 'Enter a number' }).min(0, 'Cannot be negative').max(1_000_000, 'Too large'),
  bio: z.string().trim().max(2000).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function DoctorProfilePage() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const user = useAppSelector((state) => state.user.user);
  const profile = useAppSelector((state) => state.user.profile) as DoctorProfile | null;
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: profile?.first_name ?? '',
      last_name: profile?.last_name ?? '',
      specialization: profile?.specialization ?? '',
      qualification: profile?.qualification ?? '',
      experience_years: profile?.experience_years ?? 0,
      consultation_fee: profile?.consultation_fee ?? 0,
      bio: profile?.bio ?? '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await dispatch(updateDoctorProfile({ ...values, bio: blankToNull(values.bio) })).unwrap();
      toast.success('Profile saved');
      reset(values);
    } catch (error) {
      for (const [field, message] of Object.entries(fieldErrorsOf(error))) {
        if (field in values) setError(field as keyof FormValues, { message });
      }
      setFormError(errorMessage(error));
    }
  });

  return (
    <>
      <PageHeader title="My profile" description="This is what patients see when they search for a doctor." />
      <Panel className="max-w-2xl">
        {formError && (
          <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {formError}
          </p>
        )}
        <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
          <Input label="Email" value={user?.email ?? ''} readOnly wrapperClassName="sm:col-span-2" hint="Your sign-in name. Ask the administrator to change it." />
          <Input label="First name" error={errors.first_name?.message} {...register('first_name')} />
          <Input label="Last name" error={errors.last_name?.message} {...register('last_name')} />
          <Input label="Specialization" error={errors.specialization?.message} {...register('specialization')} />
          <Input label="Qualification" error={errors.qualification?.message} {...register('qualification')} />
          <Input label="Years of experience" type="number" min={0} error={errors.experience_years?.message} {...register('experience_years', { valueAsNumber: true })} />
          <Input label="Consultation fee (INR)" type="number" min={0} step="50" error={errors.consultation_fee?.message} {...register('consultation_fee', { valueAsNumber: true })} />
          <Textarea label="About you" rows={4} wrapperClassName="sm:col-span-2" error={errors.bio?.message} {...register('bio')} />
          <div className="sm:col-span-2">
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
              Save changes
            </Button>
          </div>
        </form>

        <div className="mt-6 border-t border-rule pt-4">
          <p className="mb-2 text-sm font-medium">Departments</p>
          <div className="flex flex-wrap gap-1.5">
            {(profile?.departments ?? []).length === 0 ? (
              <span className="text-sm text-ink-soft">None assigned yet.</span>
            ) : (
              (profile?.departments ?? []).map((department) => <Badge key={department.id}>{department.name}</Badge>)
            )}
          </div>
          <p className="mt-2 text-xs text-ink-soft">Departments are managed by the clinic administrator.</p>
        </div>
      </Panel>
    </>
  );
}
