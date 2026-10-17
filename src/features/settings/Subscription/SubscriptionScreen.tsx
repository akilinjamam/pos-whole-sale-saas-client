import dayjs from 'dayjs';
import { AlertTriangle, Check, Clock, CreditCard, Minus } from 'lucide-react';
import { useState } from 'react';

import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { money } from '@/features/dealers/creditMath';
import { useCan } from '@/hooks/data/useAuth';
import { useRequestPlan, useSubscription, useWithdrawPlanRequest } from '@/hooks/data/useOrg';
import { cn } from '@/lib/utils';

import { DataAndClosing } from './DataAndClosing';

import type { BillingCycle, LimitedResource, OrgStatus, PlanFeature } from '@shared/enums';
import type { PlanPayload, SubscriptionPayload } from '@shared/types';

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
  { key: 'PURCHASING', label: 'Purchase orders and reorder suggestions' },
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
 * gateway comes later (phase 10). The owner compares the plans here and asks for one; the platform
 * applies it when the payment is recorded.
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
              Catalog, stock, dealers, wholesale orders, dispatch, invoices, receivables, and
              receiving from suppliers (goods receipts, supplier bills and payments, returns) are
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

      {data.planRequest && <PendingRequest data={data} />}

      <ComparePlans data={data} />

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

      <DataAndClosing data={data} />
    </div>
  );
}

// ─── Plan request ───────────────────────────────────────────────────────────────────────

const CYCLE_LABEL: Record<BillingCycle, string> = { MONTHLY: 'monthly', YEARLY: 'yearly' };

const price = (plan: PlanPayload, cycle: BillingCycle) =>
  cycle === 'YEARLY' ? plan.priceYearlyMinor : plan.priceMonthlyMinor;

/** What the business already uses beyond this plan's limits — it would have to deactivate some. */
function overLimits(plan: PlanPayload, usage: SubscriptionPayload['usage']): string[] {
  return RESOURCES.flatMap(({ key, label }) => {
    const limit = plan.limits[key];
    return limit !== null && usage[key] > limit
      ? [`${label.toLowerCase()}: ${usage[key]} in use, plan allows ${limit}`]
      : [];
  });
}

function PendingRequest({ data }: { data: SubscriptionPayload }) {
  const can = useCan();
  const withdraw = useWithdrawPlanRequest();
  const request = data.planRequest!;

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="flex items-start gap-3 text-sm">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="space-y-0.5">
            <p>
              You asked for the <strong>{request.planName}</strong> plan, paid{' '}
              {CYCLE_LABEL[request.cycle]}, on {day(request.requestedAt)}
              {request.requestedByName ? ` (${request.requestedByName})` : ''}.
            </p>
            <p className="text-muted-foreground">
              It starts when we receive your payment — see how to pay below.
            </p>
          </div>
        </div>
        {can('org:update') && (
          <Button
            variant="outline"
            size="sm"
            disabled={withdraw.isPending}
            onClick={() => withdraw.mutate()}
          >
            Withdraw request
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ComparePlans({ data }: { data: SubscriptionPayload }) {
  const can = useCan();
  const [cycle, setCycle] = useState<BillingCycle>(data.planRequest?.cycle ?? 'MONTHLY');
  const [chosen, setChosen] = useState<PlanPayload | null>(null);
  const mayRequest = can('org:update') && data.status !== 'CANCELLED';

  if (data.plans.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">Plans</CardTitle>
          <CardDescription>
            {mayRequest
              ? 'Choose the plan you want to pay for. Nothing changes until your payment is recorded.'
              : 'Ask the business owner to choose a plan.'}
          </CardDescription>
        </div>
        <div className="inline-flex rounded-md border p-0.5" role="group" aria-label="Billing">
          {(['MONTHLY', 'YEARLY'] as const).map((c) => (
            <Button
              key={c}
              size="sm"
              variant={cycle === c ? 'default' : 'ghost'}
              aria-pressed={cycle === c}
              onClick={() => setCycle(c)}
            >
              {c === 'MONTHLY' ? 'Monthly' : 'Yearly'}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {data.plans.map((plan) => {
          const current = plan.code === data.planCode;
          const requested =
            data.planRequest?.planCode === plan.code && data.planRequest.cycle === cycle;
          const yearlySaving = plan.priceMonthlyMinor * 12 - plan.priceYearlyMinor;
          return (
            <div
              key={plan.code}
              className={cn(
                'flex flex-col gap-3 rounded-lg border p-4',
                current && 'border-primary',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{plan.name}</h3>
                {current && <Badge variant="secondary">Current plan</Badge>}
              </div>
              <div>
                <span className="text-2xl font-semibold tabular-nums">
                  {money(price(plan, cycle))}
                </span>
                <span className="text-sm text-muted-foreground">
                  {' '}
                  / {cycle === 'YEARLY' ? 'year' : 'month'}
                </span>
                {cycle === 'YEARLY' && yearlySaving > 0 && (
                  <p className="text-xs text-primary">Save {money(yearlySaving)} a year</p>
                )}
              </div>
              {plan.description && (
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              )}
              <ul className="space-y-1.5 text-sm">
                {RESOURCES.map(({ key, label }) => (
                  <li key={key} className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="tabular-nums">{plan.limits[key] ?? 'Unlimited'}</span>
                  </li>
                ))}
                {FEATURES.map(({ key, label }) => {
                  const included = plan.features.includes(key);
                  const Icon = included ? Check : Minus;
                  return (
                    <li
                      key={key}
                      className={cn('flex items-center gap-2', !included && 'text-muted-foreground')}
                    >
                      <Icon className={cn('h-4 w-4 shrink-0', included && 'text-primary')} aria-hidden="true" />
                      {label.split(' — ')[0]}
                      <span className="sr-only">{included ? '(included)' : '(not included)'}</span>
                    </li>
                  );
                })}
              </ul>
              {mayRequest && (
                <Button
                  className="mt-auto"
                  variant={requested ? 'secondary' : current ? 'outline' : 'default'}
                  disabled={requested}
                  onClick={() => setChosen(plan)}
                >
                  {requested ? 'Requested' : current ? 'Keep this plan' : 'Request this plan'}
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
      {chosen && (
        <RequestDialog
          plan={chosen}
          cycle={cycle}
          data={data}
          onClose={() => setChosen(null)}
        />
      )}
    </Card>
  );
}

function RequestDialog({
  plan,
  cycle,
  data,
  onClose,
}: {
  plan: PlanPayload;
  cycle: BillingCycle;
  data: SubscriptionPayload;
  onClose: () => void;
}) {
  const request = useRequestPlan();
  const [note, setNote] = useState('');
  const over = overLimits(plan, data.usage);
  const replaces = data.planRequest && data.planRequest.planCode !== plan.code;

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Request the ${plan.name} plan`}
      description={`${money(price(plan, cycle))} per ${cycle === 'YEARLY' ? 'year' : 'month'}. We switch your plan when your payment is recorded.`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={request.isPending}
            onClick={() =>
              request.mutate(
                { planCode: plan.code, cycle, note: note.trim() || null },
                { onSuccess: onClose },
              )
            }
          >
            Send request
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {replaces && (
          <p className="text-sm text-muted-foreground">
            This replaces your request for the {data.planRequest!.planName} plan.
          </p>
        )}
        {over.length > 0 && (
          <div className="flex gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
            <div>
              <p>You use more than this plan allows:</p>
              <ul className="list-disc pl-5">
                {over.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p>Existing records keep working, but you cannot add more until you are under the limit.</p>
            </div>
          </div>
        )}
        <Field label="Note (optional)">
          {(p) => (
            <Textarea
              {...p}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="e.g. we will pay by bKash this week"
            />
          )}
        </Field>
      </div>
    </Dialog>
  );
}
