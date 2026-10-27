import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/fields';
import { clearAuthError, login } from '../../features/auth/authSlice';
import { paths } from '../../routes/paths';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { errorMessage, fieldErrorsOf } from '../../utils/errors';

const schema = z.object({
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

type FormValues = z.infer<typeof schema>;

const DEMO_ACCOUNTS = [
  { label: 'Patient', email: 'patient1@medicare.local', password: 'Patient@123' },
  { label: 'Doctor', email: 'doctor1@medicare.local', password: 'Doctor@123' },
  { label: 'Admin', email: 'admin@medicare.local', password: 'Admin@123' },
];

export default function Login() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const pending = useAppSelector((state) => state.auth.loginPending);
  const bannerError = useAppSelector((state) => state.auth.error);
  const [formError, setFormError] = useState<string | null>(null);
  const justRegistered = (location.state as { registered?: boolean } | null)?.registered === true;

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  // No navigation here: once the login succeeds the auth state flips and AuthLayout redirects to the right home page.
  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    dispatch(clearAuthError());
    try {
      await dispatch(login(values)).unwrap();
    } catch (error) {
      const fields = fieldErrorsOf(error);
      if (fields.email) setError('email', { message: fields.email });
      if (fields.password) setError('password', { message: fields.password });
      setFormError(errorMessage(error));
    }
  });

  const fillDemo = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setValue('email', account.email, { shouldValidate: true });
    setValue('password', account.password, { shouldValidate: true });
  };

  const problem = formError ?? bannerError;

  return (
    <div>
      <h2 className="text-2xl font-semibold">Sign in</h2>
      <p className="mt-1 text-ink-soft">Use the account you registered with, or one of the demo accounts below.</p>

      {justRegistered && (
        <p role="status" className="mt-5 rounded-md border border-pine-200 bg-pine-50 px-4 py-3 text-sm text-pine-800">
          Your account is ready. Sign in to continue.
        </p>
      )}
      {problem && (
        <p role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {problem}
        </p>
      )}

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        <Input label="Email" type="email" autoComplete="username" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <Button type="submit" loading={pending} className="w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        New patient?{' '}
        <Link to={paths.register} className="font-medium text-pine-700 underline underline-offset-2">
          Create an account
        </Link>
      </p>

      <details className="mt-8 rounded-md border border-rule bg-white px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium">Demo accounts</summary>
        <p className="mt-2 text-ink-soft">Seeded sample data only. Pick one to fill the form.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <Button key={account.label} variant="secondary" size="sm" onClick={() => fillDemo(account)}>
              {account.label}
            </Button>
          ))}
        </div>
      </details>
    </div>
  );
}
