import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Ban,
  CalendarPlus,
  Clock,
  CreditCard,
  Layers,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { z } from 'zod';

import { fieldErrors } from '@/api/client';
import { StatusPill } from '@/components/common/StatusPill';
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
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toMinor } from '@shared/money';
import { SUBSCRIPTION_PAYMENT_METHODS } from '@shared/platform';

import {
  METHOD_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
  day,
  dayTime,
  money,
  timeLeft,
} from '../format';
import {
  useCancelTenant,
  useChangeTenantPlan,
  useDismissPlanRequest,
  useExtendTrial,
  usePlatformPlans,
  useReactivateTenant,
  useRecordPayment,
  useSuspendTenant,
  useTenant,
} from '../hooks';
import { usePlatformAuth } from '../platformAuthContext';

import type { TenantDetailPayload } from '@shared/platform';

type Action =
  | 'payment'
  | 'plan'
  | 'trial'
  | 'suspend'
  | 'reactivate'
  | 'cancel'
  | 'dismiss'
  | null;

/** `/platform/tenants/:id` — one business: its subscription, usage, payments and history. */
export function TenantDetail() {
  const { id = '' } = useParams();
  const { data: t, isLoading } = useTenant(id);
  const { can } = usePlatformAuth();
  const [action, setAction] = useState<Action>(null);

  if (isLoading || !t) return <Skeleton className="h-96 w-full" />;

  const blocked = t.status === 'SUSPENDED' || t.status === 'CANCELLED';
  const close = () => setAction(null);

  return (
    <div className="space-y-6">
      <Link
        to="/platform/tenants"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Businesses
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t.name}</h1>
          <p className="text-sm text-muted-foreground">
            {t.slug} · joined {day(t.createdAt)} · {t.signupSource.toLowerCase()}
          </p>
        </div>
        <StatusPill
          status={t.status}
          tone={STATUS_TONE[t.status]}
          label={STATUS_LABEL[t.status]}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {can('platform:billing') && !blocked && (
          <Button onClick={() => setAction('payment')}>
            <CreditCard aria-hidden="true" />
            Record payment
          </Button>
        )}
        <Button variant="outline" onClick={() => setAction('plan')}>
          <Layers aria-hidden="true" />
          Change plan
        </Button>
        {!t.currentPeriodEndsAt && !blocked && (
          <Button variant="outline" onClick={() => setAction('trial')}>
            <CalendarPlus aria-hidden="true" />
            Extend trial
          </Button>
        )}
        {blocked ? (
          <Button variant="outline" onClick={() => setAction('reactivate')}>
            <RotateCcw aria-hidden="true" />
            Reactivate
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setAction('suspend')}>
            <Ban aria-hidden="true" />
            Suspend
          </Button>
        )}
        {t.status !== 'CANCELLED' && (
          <Button
            variant="ghost"
            className="text-destructive"
            onClick={() => setAction('cancel')}
          >
            <XCircle aria-hidden="true" />
            Close account
          </Button>
        )}
      </div>

      {t.planRequest && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="flex items-start gap-3 text-sm">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <div className="space-y-0.5">
                <p>
                  <strong>Plan request:</strong> {t.planRequest.planName},{' '}
                  {t.planRequest.cycle === 'YEARLY' ? 'paid yearly' : 'paid monthly'}
                  {t.planRequest.planCode === t.planCode ? ' (their current plan)' : ''} — asked{' '}
                  {dayTime(t.planRequest.requestedAt)}
                  {t.planRequest.requestedByName ? ` by ${t.planRequest.requestedByName}` : ''}.
                </p>
                {t.planRequest.note && (
                  <p className="text-muted-foreground">“{t.planRequest.note}”</p>
                )}
                <p className="text-muted-foreground">
                  Recording a payment or changing the plan answers it.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {can('platform:billing') && !blocked && (
                <Button size="sm" onClick={() => setAction('payment')}>
                  Record payment
                </Button>
              )}
              {t.planRequest.planCode !== t.planCode && (
                <Button size="sm" variant="outline" onClick={() => setAction('plan')}>
                  Switch plan now
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setAction('dismiss')}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Subscription</CardTitle>
            <CardDescription>{timeLeft(t)}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <Item
                label="Plan"
                value={
                  t.plan
                    ? `${t.plan.name} — ${money(t.plan.priceMonthlyMinor)}/month`
                    : 'No plan (unlimited)'
                }
              />
              <Item label="Access" value={t.access.replace('_', ' ').toLowerCase()} />
              <Item label="Trial ends" value={day(t.trialEndsAt)} />
              <Item label="Paid until" value={day(t.currentPeriodEndsAt)} />
              {t.dueSince && <Item label="Payment due since" value={day(t.dueSince)} />}
              {t.graceEndsAt && <Item label="Read-only from" value={day(t.graceEndsAt)} />}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Owner and usage</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <Item
                label="Owner"
                value={`${t.ownerName ?? '—'} · ${t.ownerEmail ?? '—'}${t.ownerEmailVerified ? '' : ' (not verified)'}`}
              />
              <Item label="Phone" value={t.phone ?? '—'} />
              <Item
                label="Users / locations / products"
                value={`${t.usage.users}${limit(t, 'users')} · ${t.usage.locations}${limit(t, 'locations')} · ${t.usage.products}${limit(t, 'products')}`}
              />
              <Item label="Last active" value={dayTime(t.lastActiveAt)} />
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {t.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">None recorded.</p>
          ) : (
            <ul className="divide-y text-sm">
              {t.payments.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <Link
                    to={`/platform/payments/${p.id}`}
                    className="font-medium hover:underline"
                  >
                    {p.receiptNo}
                  </Link>
                  <span className="text-muted-foreground">
                    {day(p.paidAt)} · {METHOD_LABEL[p.method]}
                    {p.trxId ? ` ${p.trxId}` : ''} · {p.months} month{p.months === 1 ? '' : 's'}{' '}
                    to {day(p.periodEnd)}
                  </span>
                  <span className="tabular-nums">{money(p.amountMinor)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">History</CardTitle>
          <CardDescription>Every platform action on this business.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y text-sm">
            {t.audit.map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span className="font-medium">
                  {a.action.replaceAll('_', ' ').toLowerCase()}
                </span>
                <span className="text-muted-foreground">
                  {typeof a.details?.reason === 'string' ? `“${a.details.reason}” · ` : ''}
                  {a.adminName ?? '—'} · {dayTime(a.at)}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {action === 'payment' && <RecordPaymentDialog tenant={t} onClose={close} />}
      {action === 'plan' && <ChangePlanDialog tenant={t} onClose={close} />}
      {action === 'trial' && <ExtendTrialDialog tenant={t} onClose={close} />}
      {(action === 'suspend' ||
        action === 'reactivate' ||
        action === 'cancel' ||
        action === 'dismiss') && (
        <ReasonDialog tenant={t} kind={action} onClose={close} />
      )}
    </div>
  );
}

function limit(t: TenantDetailPayload, key: 'users' | 'locations' | 'products'): string {
  const cap = t.plan?.limits[key];
  return cap === null || cap === undefined ? '' : `/${cap}`;
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

// ─── Record payment ─────────────────────────────────────────────────────────────────────

const paymentSchema = z
  .object({
    amount: z.coerce.number().positive('More than zero').max(10_000_000),
    method: z.enum(SUBSCRIPTION_PAYMENT_METHODS),
    trxId: z.string().trim().max(60),
    months: z.coerce.number().int().min(1).max(36),
    planCode: z.string(),
    paidOn: z.string().min(1, 'Required'),
    note: z.string().trim().max(300),
  })
  .refine((v) => v.method === 'CASH' || v.method === 'OTHER' || v.trxId.length >= 3, {
    path: ['trxId'],
    message: 'Enter the transaction id or bank reference',
  });
type PaymentValues = z.infer<typeof paymentSchema>;

function RecordPaymentDialog({
  tenant,
  onClose,
}: {
  tenant: TenantDetailPayload;
  onClose: () => void;
}) {
  const record = useRecordPayment();
  const { data: plans } = usePlatformPlans();
  const today = new Date().toISOString().slice(0, 10);
  // A plan request fills in its plan, its cycle (12 months for yearly) and that price.
  const request = tenant.planRequest;
  const yearly = request?.cycle === 'YEARLY';
  const pricedPlan = request
    ? (plans?.find((p) => p.code === request.planCode) ??
      (tenant.plan?.code === request.planCode ? tenant.plan : null))
    : tenant.plan;
  const priceOf = (plan: typeof pricedPlan) =>
    plan ? (yearly ? plan.priceYearlyMinor : plan.priceMonthlyMinor) / 100 : 0;
  const form = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: priceOf(pricedPlan),
      method: 'BKASH',
      trxId: '',
      months: yearly ? 12 : 1,
      planCode: request?.planCode ?? tenant.planCode ?? '',
      paidOn: today,
      note: '',
    },
  });
  const errors = form.formState.errors;

  // The plan list may arrive after the dialog opens; fill the price then, unless already typed.
  useEffect(() => {
    if (pricedPlan && !form.getFieldState('amount').isDirty) {
      form.setValue('amount', priceOf(pricedPlan));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricedPlan?.code]);

  const onSubmit = form.handleSubmit((v) =>
    record.mutate(
      {
        orgId: tenant.id,
        body: {
          amountMinor: toMinor(v.amount),
          method: v.method,
          trxId: v.trxId || null,
          months: v.months,
          ...(v.planCode && v.planCode !== tenant.planCode ? { planCode: v.planCode } : {}),
          // Midday Dhaka time on the chosen date — never "in the future" for a payment made today.
          paidAt: v.paidOn === today ? new Date().toISOString() : `${v.paidOn}T06:00:00.000Z`,
          note: v.note || null,
        },
      },
      {
        onSuccess: onClose,
        onError: (error) => {
          for (const f of fieldErrors(error)) {
            const key =
              f.path === 'amountMinor' ? 'amount' : f.path === 'paidAt' ? 'paidOn' : f.path;
            if (key in v) form.setError(key as keyof PaymentValues, { message: f.message });
          }
        },
      },
    ),
  );

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Record a payment — ${tenant.name}`}
      description="The period starts where the current one (or the unused trial) ends, or today if that has passed."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void onSubmit()} disabled={record.isPending}>
            Record payment
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Amount (৳)" required error={errors.amount?.message}>
          {(p) => (
            <Input
              {...p}
              {...form.register('amount')}
              type="number"
              step="0.01"
              min="0"
              autoFocus
            />
          )}
        </Field>
        <Field label="Months paid for" required error={errors.months?.message}>
          {(p) => <Input {...p} {...form.register('months')} type="number" min={1} max={36} />}
        </Field>
        <Field label="Method" required error={errors.method?.message}>
          {(p) => (
            <Select {...p} {...form.register('method')}>
              {SUBSCRIPTION_PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {METHOD_LABEL[m]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Transaction id / reference" error={errors.trxId?.message}>
          {(p) => <Input {...p} {...form.register('trxId')} placeholder="e.g. 9BC4XY7Q2M" />}
        </Field>
        <Field label="Plan" error={errors.planCode?.message}>
          {(p) => (
            <Select {...p} {...form.register('planCode')} placeholder="Choose a plan" required>
              {(plans ?? []).map((plan) => (
                <option key={plan.code} value={plan.code}>
                  {plan.name} — {money(plan.priceMonthlyMinor)}/month
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Paid on" required error={errors.paidOn?.message}>
          {(p) => <Input {...p} {...form.register('paidOn')} type="date" max={today} />}
        </Field>
        <Field label="Note" error={errors.note?.message} className="sm:col-span-2">
          {(p) => <Textarea {...p} {...form.register('note')} rows={2} />}
        </Field>
      </form>
    </Dialog>
  );
}

// ─── Change plan / extend trial / suspend · reactivate · close ─────────────────────────

function ChangePlanDialog({
  tenant,
  onClose,
}: {
  tenant: TenantDetailPayload;
  onClose: () => void;
}) {
  const change = useChangeTenantPlan();
  const { data: plans } = usePlatformPlans();
  const [planCode, setPlanCode] = useState(
    tenant.planRequest?.planCode ?? tenant.planCode ?? '',
  );

  return (
    <Dialog
      open
      onClose={onClose}
      title="Change plan"
      description="Takes effect on the business's next request. It does not change what they have paid for."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!planCode || planCode === tenant.planCode || change.isPending}
            onClick={() =>
              change.mutate({ id: tenant.id, body: { planCode } }, { onSuccess: onClose })
            }
          >
            Change plan
          </Button>
        </>
      }
    >
      <Select
        value={planCode}
        onChange={(e) => setPlanCode(e.target.value)}
        aria-label="Plan"
        placeholder="Choose a plan"
      >
        {(plans ?? []).map((plan) => (
          <option key={plan.code} value={plan.code}>
            {plan.name} — {plan.limits.users ?? '∞'} users,{' '}
            {plan.features.length ? plan.features.join(', ') : 'core only'}
          </option>
        ))}
      </Select>
    </Dialog>
  );
}

function ExtendTrialDialog({
  tenant,
  onClose,
}: {
  tenant: TenantDetailPayload;
  onClose: () => void;
}) {
  const extend = useExtendTrial();
  const [days, setDays] = useState(7);

  return (
    <Dialog
      open
      onClose={onClose}
      title="Extend the trial"
      description={`From ${day(tenant.trialEndsAt)} — or from today, if that has passed.`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!(days >= 1 && days <= 90) || extend.isPending}
            onClick={() =>
              extend.mutate({ id: tenant.id, body: { days } }, { onSuccess: onClose })
            }
          >
            Extend
          </Button>
        </>
      }
    >
      <Input
        type="number"
        min={1}
        max={90}
        value={days}
        onChange={(e) => setDays(Number(e.target.value))}
        aria-label="Days"
      />
    </Dialog>
  );
}

const REASON_COPY = {
  suspend: {
    title: 'Suspend this business',
    verb: 'Suspend',
    help: 'Everyone in the business is shut out until you reactivate it. Their data is kept.',
  },
  reactivate: {
    title: 'Reactivate this business',
    verb: 'Reactivate',
    help: 'Access returns as their dates allow — a lapsed subscription is still past due.',
  },
  cancel: {
    title: 'Close this account',
    verb: 'Close account',
    help: 'The business is shut out. Their data is kept until it is deleted (phase 7).',
  },
  dismiss: {
    title: 'Dismiss the plan request',
    verb: 'Dismiss',
    help: 'Nothing else changes. The business sees the request is gone and can ask again.',
  },
} as const;

function ReasonDialog({
  tenant,
  kind,
  onClose,
}: {
  tenant: TenantDetailPayload;
  kind: 'suspend' | 'reactivate' | 'cancel' | 'dismiss';
  onClose: () => void;
}) {
  const suspend = useSuspendTenant();
  const reactivate = useReactivateTenant();
  const cancel = useCancelTenant();
  const dismiss = useDismissPlanRequest();
  const mutation = { suspend, reactivate, cancel, dismiss }[kind];
  const copy = REASON_COPY[kind];
  const [reason, setReason] = useState('');

  return (
    <Dialog
      open
      onClose={onClose}
      title={`${copy.title} — ${tenant.name}`}
      description={copy.help}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={kind === 'reactivate' || kind === 'dismiss' ? 'default' : 'destructive'}
            disabled={reason.trim().length < 3 || mutation.isPending}
            onClick={() =>
              mutation.mutate(
                { id: tenant.id, body: { reason: reason.trim() } },
                { onSuccess: onClose },
              )
            }
          >
            {copy.verb}
          </Button>
        </>
      }
    >
      <Textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        placeholder="Why — kept in the history"
        aria-label="Reason"
        autoFocus
      />
    </Dialog>
  );
}
