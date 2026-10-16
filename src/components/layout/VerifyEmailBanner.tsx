import { MailWarning } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useCurrentUser, useResendVerification } from '@/hooks/data/useAuth';

/**
 * Shown on every screen until the signed-in user verifies their email (SaaS phase 3). The server is
 * what enforces it — an unverified owner's "add user" is refused with EMAIL_NOT_VERIFIED — this only
 * says why, and offers the link again.
 *
 * `=== false` rather than falsy: a user stored in the browser before this field existed has it
 * undefined, and should not see the banner flash until `/auth/me` answers.
 */
export function VerifyEmailBanner() {
  const user = useCurrentUser();
  const resend = useResendVerification();

  if (user?.emailVerified !== false) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100 md:px-6"
    >
      <MailWarning className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        Verify your email <strong>{user.email}</strong> to add your staff. We sent you a link.
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={() => resend.mutate()}
        disabled={resend.isPending || resend.isSuccess}
      >
        {resend.isSuccess ? 'Sent' : 'Send a new link'}
      </Button>
    </div>
  );
}
