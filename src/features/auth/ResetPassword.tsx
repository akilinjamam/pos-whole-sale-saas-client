import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { errorCode, fieldErrors } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { useResetPassword } from '@/hooks/data/useAuth';

import { resetPasswordSchema, type ResetPasswordFormValues } from './accountSchemas';
import { AuthLayout } from './AuthLayout';
import { PasswordInput } from './PasswordInput';

const askAgain = (
  <p>
    <Link to="/forgot-password" className="text-primary underline-offset-4 hover:underline">
      Send me a new link
    </Link>
  </p>
);

/** Choose a new password from the emailed link (`/reset-password?token=…`). */
export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const reset = useResetPassword();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirm: '' },
    mode: 'onTouched',
  });
  const errors = form.formState.errors;

  if (!token || errorCode(reset.error) === 'TOKEN_INVALID') {
    return (
      <AuthLayout title="This link has expired" footer={askAgain}>
        <p className="text-sm text-muted-foreground">
          Password reset links work once, for one hour. Ask for a new one and use the newest
          email.
        </p>
      </AuthLayout>
    );
  }

  const onSubmit = form.handleSubmit(({ password }) => {
    reset.mutate(
      { token, password },
      {
        onSuccess: () => {
          toast.success('Password changed — sign in with your new password');
          navigate('/login', { replace: true });
        },
        onError: (error) => {
          const field = fieldErrors(error).find((f) => f.path === 'password');
          if (field) form.setError('password', { message: field.message });
        },
      },
    );
  });

  return (
    <AuthLayout
      title="Choose a new password"
      description="This signs you out everywhere else."
      footer={askAgain}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field
          label="New password"
          required
          hint="At least 8 characters."
          error={errors.password?.message}
        >
          {(props) => (
            <PasswordInput
              {...props}
              {...form.register('password')}
              autoComplete="new-password"
              autoFocus
              disabled={reset.isPending}
            />
          )}
        </Field>
        <Field label="Repeat it" required error={errors.confirm?.message}>
          {(props) => (
            <PasswordInput
              {...props}
              {...form.register('confirm')}
              autoComplete="new-password"
              disabled={reset.isPending}
            />
          )}
        </Field>
        <Button type="submit" className="w-full" disabled={reset.isPending}>
          {reset.isPending ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <KeyRound aria-hidden="true" />
          )}
          Save the new password
        </Button>
      </form>
    </AuthLayout>
  );
}
