import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/fields';
import { Panel } from '../../components/ui/Panel';
import { useToast } from '../../components/ui/Toast';
import { updatePatientProfile } from '../../features/user/userSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { PatientProfile } from '../../types';
import { errorMessage, fieldErrorsOf } from '../../utils/errors';
import { blankToNull, todayISO } from '../../utils/format';

const schema = z.object({
  first_name: z.string().trim().min(1, 'First name is required').max(100),
  last_name: z.string().trim().min(1, 'Last name is required').max(100),
  date_of_birth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((value) => value <= todayISO(), 'Date of birth cannot be in the future'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  phone: z.string().trim().regex(/^[0-9+()\-\s]{7,20}$/, 'Enter a valid phone number'),
  address: z.string().trim().max(255).optional(),
  emergency_contact: z.string().trim().max(150).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function PatientProfilePage() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const user = useAppSelector((state) => state.user.user);
  const profile = useAppSelector((state) => state.user.profile) as PatientProfile | null;
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
      date_of_birth: profile?.date_of_birth ?? '',
      gender: profile?.gender ?? 'FEMALE',
      phone: profile?.phone ?? '',
      address: profile?.address ?? '',
      emergency_contact: profile?.emergency_contact ?? '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await dispatch(
        updatePatientProfile({
          first_name: values.first_name,
          last_name: values.last_name,
          date_of_birth: values.date_of_birth,
          gender: values.gender,
          phone: values.phone,
          address: blankToNull(values.address),
          emergency_contact: blankToNull(values.emergency_contact),
        }),
      ).unwrap();
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
      <PageHeader title="My profile" description="Keep your details current so your doctor can reach you." />
      <Panel className="max-w-2xl">
        {formError && (
          <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {formError}
          </p>
        )}
        <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
          <Input label="Email" value={user?.email ?? ''} readOnly hint="This is your sign-in name and cannot be changed here." wrapperClassName="sm:col-span-2" />
          <Input label="First name" error={errors.first_name?.message} {...register('first_name')} />
          <Input label="Last name" error={errors.last_name?.message} {...register('last_name')} />
          <Input label="Date of birth" type="date" max={todayISO()} error={errors.date_of_birth?.message} {...register('date_of_birth')} />
          <Select label="Gender" error={errors.gender?.message} {...register('gender')}>
            <option value="FEMALE">Female</option>
            <option value="MALE">Male</option>
            <option value="OTHER">Other</option>
          </Select>
          <Input label="Phone" type="tel" wrapperClassName="sm:col-span-2" error={errors.phone?.message} {...register('phone')} />
          <Input label="Address" wrapperClassName="sm:col-span-2" error={errors.address?.message} {...register('address')} />
          <Input label="Emergency contact" wrapperClassName="sm:col-span-2" hint="Name and phone number" error={errors.emergency_contact?.message} {...register('emergency_contact')} />
          <div className="sm:col-span-2">
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
              Save changes
            </Button>
          </div>
        </form>
      </Panel>
    </>
  );
}
