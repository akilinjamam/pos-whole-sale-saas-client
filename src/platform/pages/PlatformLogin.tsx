import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { AuthLayout } from '@/features/auth/AuthLayout';
import { PasswordInput } from '@/features/auth/PasswordInput';

import { usePlatformLogin } from '../hooks';
import { usePlatformAuth } from '../platformAuthContext';

import type { Location } from 'react-router-dom';

const schema = z.object({
  email: z.string().trim().min(1, 'Enter your email').email('That does not look like an email'),
  password: z.string().min(1, 'Enter your password'),
});
type Values = z.infer<typeof schema>;

/** `/platform/login` — the platform's own sign-in, separate from any business's. */
export function PlatformLogin() {
  const { status, signIn } = usePlatformAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const login = usePlatformLogin();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  if (status === 'signedIn') return <Navigate to="/platform" replace />;

  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? '/platform';
  const onSubmit = form.handleSubmit((values) =>
    login.mutate(values, {
      onSuccess: (response) => {
        signIn(response);
        navigate(from, { replace: true });
      },
      onError: () => {
        form.resetField('password');
        form.setFocus('password');
      },
    }),
  );

  return (
    <AuthLayout title="Platform admin" description="For the people who run the service.">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Email" required error={form.formState.errors.email?.message}>
          {(props) => (
            <Input
              {...props}
              {...form.register('email')}
              type="email"
              autoComplete="username"
              autoFocus
            />
          )}
        </Field>
        <Field label="Password" required error={form.formState.errors.password?.message}>
          {(props) => (
            <PasswordInput
              {...props}
              {...form.register('password')}
              autoComplete="current-password"
            />
          )}
        </Field>
        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <ShieldCheck aria-hidden="true" />
          )}
          Sign in
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Back to Home
        </Button>
      </form>
    </AuthLayout>
  );
}
