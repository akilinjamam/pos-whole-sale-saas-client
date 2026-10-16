import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Rocket } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { fieldErrors } from '@/api/client';
import { useAppSelector } from '@/app/store';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useSignup } from '@/hooks/data/useAuth';
import { selectAuthStatus } from '@/store/authSlice';

import { signupSchema, type SignupFormValues } from './accountSchemas';
import { AuthLayout } from './AuthLayout';
import { PasswordInput } from './PasswordInput';

/**
 * Public signup (SaaS phase 3): a business and its owner in one form. The server creates the
 * business on a free trial, sends a verification email, and signs the owner straight in — so a
 * success lands on the dashboard, where the first-steps checklist takes over.
 */
export function Signup() {
  const status = useAppSelector(selectAuthStatus);
  const navigate = useNavigate();
  const signup = useSignup();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { businessName: '', ownerName: '', email: '', phone: '', password: '' },
    mode: 'onTouched',
  });
  const errors = form.formState.errors;

  if (status === 'authenticated') return <Navigate to="/" replace />;

  const onSubmit = form.handleSubmit((values) => {
    signup.mutate(
      { ...values, phone: values.phone || null },
      {
        onSuccess: () => navigate('/', { replace: true }),
        onError: (error) => {
          for (const f of fieldErrors(error)) {
            if (f.path in values) {
              form.setError(f.path as keyof SignupFormValues, { message: f.message });
            }
          }
        },
      },
    );
  });

  return (
    <AuthLayout
      wide
      title="Start your free trial"
      description="Set up your business in a minute. No card needed."
      footer={
        <p>
          Already have an account?{' '}
          <Link to="/login" className="text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Business name" required error={errors.businessName?.message}>
          {(props) => (
            <Input
              {...props}
              {...form.register('businessName')}
              autoComplete="organization"
              autoFocus
              placeholder="e.g. Rahman Optical"
              disabled={signup.isPending}
            />
          )}
        </Field>

        <Field label="Your name" required error={errors.ownerName?.message}>
          {(props) => (
            <Input
              {...props}
              {...form.register('ownerName')}
              autoComplete="name"
              disabled={signup.isPending}
            />
          )}
        </Field>

        <Field
          label="Email"
          required
          hint="You will sign in with this, and we send a link to verify it."
          error={errors.email?.message}
        >
          {(props) => (
            <Input
              {...props}
              {...form.register('email')}
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              disabled={signup.isPending}
            />
          )}
        </Field>

        <Field label="Phone" error={errors.phone?.message}>
          {(props) => (
            <Input
              {...props}
              {...form.register('phone')}
              type="tel"
              autoComplete="tel"
              placeholder="01XXXXXXXXX"
              disabled={signup.isPending}
            />
          )}
        </Field>

        <Field
          label="Password"
          required
          hint="At least 8 characters."
          error={errors.password?.message}
        >
          {(props) => (
            <PasswordInput
              {...props}
              {...form.register('password')}
              autoComplete="new-password"
              disabled={signup.isPending}
            />
          )}
        </Field>

        <Button type="submit" className="w-full" disabled={signup.isPending}>
          {signup.isPending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Creating your business…
            </>
          ) : (
            <>
              <Rocket aria-hidden="true" />
              Create my business
            </>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
