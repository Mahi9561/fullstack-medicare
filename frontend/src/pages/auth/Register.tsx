import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/fields';
import { paths } from '../../routes/paths';
import { authApi } from '../../services/auth.api';
import { errorMessage, fieldErrorsOf, toRejection } from '../../utils/errors';
import { blankToNull, todayISO } from '../../utils/format';

const schema = z
  .object({
    first_name: z.string().trim().min(1, 'First name is required').max(100),
    last_name: z.string().trim().min(1, 'Last name is required').max(100),
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[A-Za-z]/, 'Include at least one letter')
      .regex(/\d/, 'Include at least one number'),
    confirm_password: z.string().min(1, 'Repeat your password'),
    date_of_birth: z
      .string()
      .min(1, 'Date of birth is required')
      .refine((value) => value <= todayISO(), 'Date of birth cannot be in the future'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { errorMap: () => ({ message: 'Choose one' }) }),
    phone: z.string().trim().regex(/^[0-9+()\-\s]{7,20}$/, 'Enter a valid phone number'),
    address: z.string().trim().max(255).optional(),
    emergency_contact: z.string().trim().max(150).optional(),
  })
  .refine((values) => values.password === values.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type FormValues = z.infer<typeof schema>;

export default function Register() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { first_name: '', last_name: '', email: '', password: '', confirm_password: '', date_of_birth: '', phone: '', address: '', emergency_contact: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await authApi.register({
        email: values.email,
        password: values.password,
        first_name: values.first_name,
        last_name: values.last_name,
        date_of_birth: values.date_of_birth,
        gender: values.gender,
        phone: values.phone,
        address: blankToNull(values.address),
        emergency_contact: blankToNull(values.emergency_contact),
      });
      navigate(paths.login, { replace: true, state: { registered: true } });
    } catch (error) {
      // Show the API's per-field messages next to the matching inputs, and anything else as a banner.
      let placed = false;
      for (const [field, message] of Object.entries(fieldErrorsOf(error))) {
        if (field in values) {
          setError(field as keyof FormValues, { message });
          placed = true;
        }
      }
      // "Email is already registered" arrives as a plain 409 with no field name, but it can only mean the email.
      if (!placed && toRejection(error).status === 409) {
        setError('email', { message: errorMessage(error) });
        placed = true;
      }
      if (!placed) setFormError(errorMessage(error));
    }
  });

  return (
    <div>
      <h2 className="text-2xl font-semibold">Create your patient account</h2>
      <p className="mt-1 text-ink-soft">Doctors are added by the clinic administrator, so this form is for patients.</p>

      {formError && (
        <p role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {formError}
        </p>
      )}

      <form onSubmit={onSubmit} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
        <Input label="First name" autoComplete="given-name" error={errors.first_name?.message} {...register('first_name')} />
        <Input label="Last name" autoComplete="family-name" error={errors.last_name?.message} {...register('last_name')} />
        <Input label="Email" type="email" autoComplete="email" wrapperClassName="sm:col-span-2" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" autoComplete="new-password" hint="At least 8 characters, with a letter and a number." error={errors.password?.message} {...register('password')} />
        <Input label="Repeat password" type="password" autoComplete="new-password" error={errors.confirm_password?.message} {...register('confirm_password')} />
        <Input label="Date of birth" type="date" max={todayISO()} autoComplete="bday" error={errors.date_of_birth?.message} {...register('date_of_birth')} />
        <Select label="Gender" error={errors.gender?.message} defaultValue="" {...register('gender')}>
          <option value="" disabled>
            Select
          </option>
          <option value="FEMALE">Female</option>
          <option value="MALE">Male</option>
          <option value="OTHER">Other</option>
        </Select>
        <Input label="Phone" type="tel" autoComplete="tel" wrapperClassName="sm:col-span-2" error={errors.phone?.message} {...register('phone')} />
        <Input label="Address (optional)" wrapperClassName="sm:col-span-2" autoComplete="street-address" error={errors.address?.message} {...register('address')} />
        <Input label="Emergency contact (optional)" wrapperClassName="sm:col-span-2" hint="Name and phone number" error={errors.emergency_contact?.message} {...register('emergency_contact')} />
        <Button type="submit" loading={isSubmitting} className="w-full sm:col-span-2">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        Already registered?{' '}
        <Link to={paths.login} className="font-medium text-pine-700 underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </div>
  );
}
