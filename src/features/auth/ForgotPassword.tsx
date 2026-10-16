import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, MailCheck, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useForgotPassword } from '@/hooks/data/useAuth';

import { forgotPasswordSchema, type ForgotPasswordFormValues } from './accountSchemas';
import { AuthLayout } from './AuthLayout';

const backToSignIn = (
  <p>
    <Link to="/login" className="text-primary underline-offset-4 hover:underline">
      Back to sign in
    </Link>
  </p>
);

/**
 * Ask for a reset link. The confirmation reads the same whether or not the address has an
 * account — the server does not say, and neither does this screen.
 */
export function ForgotPassword() {
  const forgot = useForgotPassword();
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onTouched',
  });

  if (forgot.isSuccess) {
    return (
      <AuthLayout title="Check your email" footer={backToSignIn}>
        <div className="flex gap-3 text-sm">
          <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <p>
            If an account exists for <strong>{forgot.variables}</strong>, we have sent a link to
            choose a new password. It works for one hour. Check your spam folder if it does not
            arrive in a few minutes.
          </p>
        </div>
      </AuthLayout>
    );
  }

  const onSubmit = form.handleSubmit(({ email }) => forgot.mutate(email.trim().toLowerCase()));

  return (
    <AuthLayout
      title="Forgot your password?"
      description="Enter your email and we will send you a link to choose a new one."
      footer={backToSignIn}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Email" required error={form.formState.errors.email?.message}>
          {(props) => (
            <Input
              {...props}
              {...form.register('email')}
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@company.com"
              disabled={forgot.isPending}
            />
          )}
        </Field>
        <Button type="submit" className="w-full" disabled={forgot.isPending}>
          {forgot.isPending ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Send aria-hidden="true" />
          )}
          Send the link
        </Button>
      </form>
    </AuthLayout>
  );
}
