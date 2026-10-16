import { Link } from 'react-router-dom';

import { StatusPill } from '@/components/common/StatusPill';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { STATUS_LABEL, STATUS_TONE, day, money, timeLeft } from '../format';
import { usePlatformDashboard } from '../hooks';
import { usePlatformAuth } from '../platformAuthContext';

import type { OrgStatus } from '@shared/enums';
import type { TenantSummaryPayload } from '@shared/platform';

/** `/platform` — the state of the business of selling the software. */
export function PlatformDashboard() {
  const { data, isLoading } = usePlatformDashboard();
  const { can } = usePlatformAuth();

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const statuses: OrgStatus[] = ['TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED'];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Businesses">
        <Stat
          label="Businesses"
          value={String(data.tenants.total)}
          hint={`${data.signupsThisMonth} signed up this month`}
        />
        {statuses.map((s) => (
          <Stat
            key={s}
            label={STATUS_LABEL[s]}
            value={String(data.tenants[s])}
            to={`/platform/tenants?status=${s}`}
            hint={s === 'PAST_DUE' ? `${data.readOnly} already read-only` : undefined}
          />
        ))}
        <Stat label="Revenue this month" value={money(data.revenue.thisMonthMinor)} />
        <Stat label="Last month" value={money(data.revenue.lastMonthMinor)} />
        <Stat label="Last 12 months" value={money(data.revenue.last12MonthsMinor)} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <TenantList
          title="Trials ending this week"
          empty="No trial ends in the next 7 days."
          rows={data.trialsEndingSoon}
        />
        <TenantList title="Payment due" empty="Nobody is overdue." rows={data.overdue} />
      </div>

      {can('platform:billing') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent payments</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
            ) : (
              <ul className="divide-y text-sm">
                {data.recentPayments.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2"
                  >
                    <Link
                      to={`/platform/tenants/${p.orgId}`}
                      className="font-medium hover:underline"
                    >
                      {p.orgName}
                    </Link>
                    <span className="text-muted-foreground">
                      {day(p.paidAt)} · {p.receiptNo}
                    </span>
                    <span className="tabular-nums">{money(p.amountMinor)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  to,
}: {
  label: string;
  value: string;
  hint?: string;
  to?: string;
}) {
  const body = (
    <Card className={to ? 'transition-colors hover:bg-muted/40' : undefined}>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      {hint && <CardContent className="pt-0 text-xs text-muted-foreground">{hint}</CardContent>}
    </Card>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

function TenantList({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: TenantSummaryPayload[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="divide-y text-sm">
            {rows.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <Link to={`/platform/tenants/${t.id}`} className="font-medium hover:underline">
                  {t.name}
                </Link>
                <span className="flex items-center gap-2">
                  <StatusPill
                    status={t.status}
                    tone={STATUS_TONE[t.status]}
                    label={STATUS_LABEL[t.status]}
                  />
                  <span className="text-muted-foreground">{timeLeft(t)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
