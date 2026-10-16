import { ArrowLeft, Printer, Receipt } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

import { METHOD_LABEL, day, dayTime, money } from '../format';
import { usePayment, usePayments } from '../hooks';

const LIMIT = 50;

/** `/platform/payments` — every subscription payment, newest first. */
export function PaymentsList() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const search = useDebouncedValue(q.trim(), 300);
  const { data, isLoading } = usePayments({ page, limit: LIMIT, q: search || undefined });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payments"
        icon={Receipt}
        description="Subscription payments recorded by the platform"
      />
      <Input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPage(1);
        }}
        placeholder="Receipt number or transaction id"
        className="max-w-xs"
        aria-label="Search payments"
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No payments"
          description="Payments appear here once recorded."
        />
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link
                      to={`/platform/payments/${p.id}`}
                      className="font-medium hover:underline"
                    >
                      {p.receiptNo}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link to={`/platform/tenants/${p.orgId}`} className="hover:underline">
                      {p.orgName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{day(p.paidAt)}</TableCell>
                  <TableCell className="text-sm">
                    {METHOD_LABEL[p.method]}
                    {p.trxId && <div className="text-xs text-muted-foreground">{p.trxId}</div>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {day(p.periodStart)} – {day(p.periodEnd)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {money(p.amountMinor)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {data && data.meta.totalPages > 1 && (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= data.meta.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

/** `/platform/payments/:id` — the receipt, ready to print and hand to the business. */
export function PaymentReceipt() {
  const { id = '' } = useParams();
  const { data: p, isLoading } = usePayment(id);

  if (isLoading || !p) return <Skeleton className="h-96 w-full" />;

  const rows: [string, string][] = [
    ['Receipt number', p.receiptNo],
    ['Business', p.orgName],
    ['Paid on', day(p.paidAt)],
    ['Method', `${METHOD_LABEL[p.method]}${p.trxId ? ` · ${p.trxId}` : ''}`],
    ['Plan', p.planCode],
    [
      'Period',
      `${p.months} month${p.months === 1 ? '' : 's'}: ${day(p.periodStart)} – ${day(p.periodEnd)}`,
    ],
    ['Recorded by', `${p.recordedByName ?? '—'}, ${dayTime(p.createdAt)}`],
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link
          to={`/platform/tenants/${p.orgId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {p.orgName}
        </Link>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer aria-hidden="true" />
          Print
        </Button>
      </div>

      <article className="rounded-lg border bg-card p-8 print:border-0 print:p-0">
        <header className="mb-6 flex items-start justify-between gap-4 border-b pb-4">
          <div>
            <h1 className="text-xl font-semibold">Payment receipt</h1>
            <p className="text-sm text-muted-foreground">Optical Wholesale — subscription</p>
          </div>
          <p className="text-right text-2xl font-semibold tabular-nums">
            {money(p.amountMinor)}
          </p>
        </header>
        <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
          {p.note && (
            <div className="contents">
              <dt className="text-muted-foreground">Note</dt>
              <dd className="whitespace-pre-line">{p.note}</dd>
            </div>
          )}
        </dl>
        <p className="mt-8 text-xs text-muted-foreground">Thank you for your payment.</p>
      </article>
    </div>
  );
}
