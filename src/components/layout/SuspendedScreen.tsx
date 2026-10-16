import { Ban, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useLogout } from '@/hooks/data/useAuth';

import type { SubscriptionPayload } from '@shared/types';

/**
 * Drawn in place of every screen when the business is suspended or closed (SaaS phase 4). The
 * server would refuse every request anyway (403 ORG_SUSPENDED); this says so once, plainly, instead
 * of a page of failed loads and toasts.
 */
export function SuspendedScreen({ subscription }: { subscription: SubscriptionPayload }) {
  const logout = useLogout();
  const closed = subscription.status === 'CANCELLED';

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <Ban className="h-8 w-8 text-destructive" aria-hidden="true" />
          <CardTitle>
            {closed ? 'This account is closed' : 'This account is suspended'}
          </CardTitle>
          <CardDescription>
            {closed
              ? 'The business account was closed. Contact support if you need your data.'
              : 'Access has been paused by the platform. Your data is safe. Contact support to restore it.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription.paymentInstructions && !closed && (
            <p className="whitespace-pre-line rounded-md border bg-muted/40 p-3 text-sm">
              {subscription.paymentInstructions}
            </p>
          )}
          <Button variant="outline" className="w-full" onClick={() => logout.mutate()}>
            <LogOut aria-hidden="true" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
