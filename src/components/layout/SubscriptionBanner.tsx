import { Clock, Lock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useCan } from '@/hooks/data/useAuth';
import { useSubscription } from '@/hooks/data/useOrg';
import { cn } from '@/lib/utils';

import type { ReactNode } from 'react';

const SUBSCRIPTION_PAGE = '/settings/subscription';

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`;

/**
 * The subscription line above every screen (SaaS phase 4): days left on a trial, payment due, or
 * read-only. Says nothing while the business is simply paid up. The server enforces all of it; this
 * only explains what the user is about to run into, and where to go about it.
 */
export function SubscriptionBanner() {
  const { data } = useSubscription();
  // The subscription page needs `org:read`; a cashier gets the message without a link to a refusal.
  const canOpenPage = useCan()('org:read');
  if (!data || data.access === 'BLOCKED') return null;

  let tone: 'info' | 'warn' | 'danger';
  let icon: ReactNode;
  let text: ReactNode;

  if (data.access === 'READ_ONLY') {
    tone = 'danger';
    icon = <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />;
    text =
      'Your subscription has ended. You can still view everything, but changes are paused until you renew.';
  } else if (data.status === 'PAST_DUE') {
    tone = 'warn';
    icon = <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />;
    text = `Payment is due. Your account becomes read-only in ${plural(data.daysLeft ?? 0, 'day')}.`;
  } else if (data.status === 'TRIAL' && data.daysLeft !== null) {
    tone = data.daysLeft <= 3 ? 'warn' : 'info';
    icon = <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />;
    text = `Free trial${data.plan ? ` of ${data.plan.name}` : ''}: ${plural(data.daysLeft, 'day')} left.`;
  } else if (data.status === 'ACTIVE' && data.daysLeft !== null && data.daysLeft <= 5) {
    tone = 'info';
    icon = <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />;
    text = `Your subscription renews in ${plural(data.daysLeft, 'day')}.`;
  } else {
    return null;
  }

  return (
    <div
      role="status"
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-2 text-sm md:px-6',
        tone === 'info' &&
          'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100',
        tone === 'warn' &&
          'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100',
        tone === 'danger' &&
          'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
      )}
    >
      {icon}
      <span className="min-w-0 flex-1">{text}</span>
      {canOpenPage && (
        <Link
          to={SUBSCRIPTION_PAGE}
          className="shrink-0 font-medium underline underline-offset-4"
        >
          {data.status === 'TRIAL' ? 'Plans and payment' : 'How to pay'}
        </Link>
      )}
    </div>
  );
}
