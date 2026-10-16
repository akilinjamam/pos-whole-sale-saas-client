import dayjs from 'dayjs';
import { Check, CreditCard, Minus } from 'lucide-react';

import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { money } from '@/features/dealers/creditMath';
import { useSubscription } from '@/hooks/data/useOrg';
import { cn } from '@/lib/utils';

import type { LimitedResource, OrgStatus, PlanFeature } from '@shared/enums';
import type { SubscriptionPayload } from '@shared/types';

const STATUS: Record<
  OrgStatus,
  { label: string; tone: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  TRIAL: { label: 'Free trial', tone: 'secondary' },
  ACTIVE: { label: 'Active', tone: 'default' },
  PAST_DUE: { label: 'Payment due', tone: 'destructive' },
  SUSPENDED: { label: 'Suspended', tone: 'destructive' },
  CANCELLED: { label: 'Closed', tone: 'outline' },
};

const RESOURCES: { key: LimitedResource; label: string }[] = [
  { key: 'users', label: 'Active users' },
  { key: 'locations', label: 'Warehouses and counters' },
  { key: 'products', label: 'Active products' },
];

const FEATURES: { key: PlanFeature; label: string }[] = [
  { key: 'POS', label: 'Counter POS' },
  { key: 'PURCHASING', label: 'Purchasing — orders, goods receipts, supplier returns' },
  { key: 'REPORTS', label: 'Report suite' },
];

const day = (iso: string | null) => (iso ? dayjs(iso).format('D MMM YYYY') : '—');

/** What the dates mean in words, for the state the business is in. */
function timeline(s: SubscriptionPayload): string {
  if (s.access === 'READ_ONLY')
    return `Payment was due on ${day(s.dueSince)}. Changes are paused until you renew.`;
  if (s.status === 'PAST_DUE') {
    return `Payment was due on ${day(s.dueSince)}. Your account becomes read-only on ${day(s.graceEndsAt)}.`;
  }
  if (s.status === 'TRIAL') return `Your free trial ends on ${day(s.trialEndsAt)}.`;
  if (s.status === 'ACTIVE' && s.currentPeriodEndsAt)
    return `Paid until ${day(s.currentPeriodEndsAt)}.`;
  if (s.status === 'ACTIVE') return 'Your subscription has no end date.';
  return '';
}

/**
 * Settings → Subscription (SaaS phase 4): the plan, what it includes, how much of it is in use, and
 * how to pay. Renewal is recorded by the platform when the payment arrives (phase 5); a payment
 * gateway comes later (phase 10).
 */
export function SubscriptionScreen() {
  const { data, isLoading } = useSubscription();

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader title="Subscription" icon={CreditCard} />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  const status = STATUS[data.status];
  const plan = data.plan;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Subscription"
        description="Your plan, what it includes, and how to pay"
        icon={CreditCard}
      />

      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-lg">{plan ? `${plan.name} plan` : 'No plan'}</CardTitle>
            <CardDescription>{timeline(data)}</CardDescription>
          </div>
          <Badge variant={status.tone}>{status.label}</Badge>
        </CardHeader>
        {plan && (
          <CardContent className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <span>
              <span className="text-muted-foreground">Monthly</span>{' '}
              <strong>{money(plan.priceMonthlyMinor)}</strong>
            </span>
            <span>
              <span className="text-muted-foreground">Yearly</span>{' '}
              <strong>{money(plan.priceYearlyMinor)}</strong>
            </span>
          </CardContent>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage</CardTitle>
            <CardDescription>
              Deactivating a user, location or product frees its place.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {RESOURCES.map(({ key, label }) => {
              const used = data.usage[key];
              const limit = plan ? plan.limits[key] : null;
              const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span>{label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {used}
                      {limit !== null ? ` of ${limit}` : ' · unlimited'}
                    </span>
                  </div>
                  {limit !== null && (
                    <div
                      className="h-2 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-label={label}
                      aria-valuenow={used}
                      aria-valuemin={0}
                      aria-valuemax={limit}
                    >
                      <div
                        className={cn(
                          'h-full',
                          pct >= 100
                            ? 'bg-destructive'
                            : pct >= 80
                              ? 'bg-amber-500'
                              : 'bg-primary',
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Included</CardTitle>
            <CardDescription>
              Catalog, stock, dealers, wholesale orders, dispatch, invoices and receivables are
              in every plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {FEATURES.map(({ key, label }) => {
                const included = !plan || plan.features.includes(key);
                const Icon = included ? Check : Minus;
                return (
                  <li
                    key={key}
                    className={cn(
                      'flex items-center gap-2',
                      !included && 'text-muted-foreground',
                    )}
                  >
                    <Icon
                      className={cn('h-4 w-4', included && 'text-primary')}
                      aria-hidden="true"
                    />
                    {label}
                    <span className="sr-only">
                      {included ? '(included)' : '(not included)'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How to pay</CardTitle>
          <CardDescription>
            When your payment arrives we extend your subscription — usually the same working
            day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line text-sm">
            {data.paymentInstructions ?? 'Contact us to renew or change your plan.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
