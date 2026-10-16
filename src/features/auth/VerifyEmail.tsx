import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useAppSelector } from '@/app/store';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useResendVerification, useVerifyEmail } from '@/hooks/data/useAuth';
import { selectAuthStatus } from '@/store/authSlice';

import { AuthLayout } from './AuthLayout';

/**
 * The page the verification email links to (`/verify-email?token=…`). Public, because the link is
 * often opened on a phone where nobody is signed in; the token is the credential.
 */
export function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const signedIn = useAppSelector(selectAuthStatus) === 'authenticated';
  const verify = useVerifyEmail();
  const resend = useResendVerification();

  // Once per token. StrictMode mounts effects twice in development, and a token is single-use —
  // a second call would turn a success into "this link has expired".
  const sentFor = useRef<string | null>(null);
  const { mutate } = verify;
  useEffect(() => {
    if (!token || sentFor.current === token) return;
    sentFor.current = token;
    mutate(token);
  }, [token, mutate]);

  const next = (
    <Link to={signedIn ? '/' : '/login'} className={cn(buttonVariants(), 'w-full')}>
      {signedIn ? 'Go to the dashboard' : 'Sign in'}
    </Link>
  );

  if (verify.isSuccess) {
    return (
      <AuthLayout title="Email verified">
        <div className="space-y-4">
          <p className="flex gap-3 text-sm">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <span>
              <strong>{verify.data.email}</strong> is confirmed. You can now add your staff.
            </span>
          </p>
          {next}
        </div>
      </AuthLayout>
    );
  }

  if (!token || verify.isError) {
    return (
      <AuthLayout title="This link has expired">
        <div className="space-y-4">
          <p className="flex gap-3 text-sm text-muted-foreground">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
            <span>
              Verification links work once, for 48 hours.{' '}
              {signedIn
                ? 'Send yourself a new one below.'
                : 'Sign in and use “Send a new link” in the banner at the top.'}
            </span>
          </p>
          {signedIn ? (
            <Button
              className="w-full"
              onClick={() => resend.mutate()}
              disabled={resend.isPending || resend.isSuccess}
            >
              {resend.isSuccess ? 'Sent — check your inbox' : 'Send a new link'}
            </Button>
          ) : (
            next
          )}
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Verifying your email…">
      <div className="flex justify-center py-4">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-label="Verifying"
        />
      </div>
    </AuthLayout>
  );
}
