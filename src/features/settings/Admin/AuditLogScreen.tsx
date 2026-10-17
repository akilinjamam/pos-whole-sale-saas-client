import { ScrollText, Search } from 'lucide-react';
import { useState } from 'react';

import { DataTable } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusPill } from '@/components/common/StatusPill';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useAudit } from '@/hooks/data/useAdmin';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { humanise } from '@/lib/utils';

import { AUDIT_ACTIONS } from '@shared/enums';

import type { Column } from '@/components/common/DataTable';
import type { AuditAction } from '@shared/enums';
import type { AuditEntryPayload } from '@shared/types';

/** Every action, as the log shows it — exhaustive, so a new one cannot print as a raw code. */
const ACTION_LABEL: Record<AuditAction, string> = {
  CREDIT_OVERRIDE: 'Credit override',
  ORG_PROFILE_CHANGE: 'Company profile',
  SETTINGS_CHANGE: 'Business rules',
  NUMBER_SERIES_CHANGE: 'Numbering',
  PLAN_REQUEST: 'Plan requested',
  PLAN_REQUEST_WITHDRAW: 'Plan request withdrawn',
  DATA_EXPORT: 'Data exported',
  ORG_CLOSE: 'Business closed',
};

const show = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'on' : 'off';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

/** What changed, field by field: `roundInvoiceTo 0 → 100`. */
function Changes({ e }: { e: AuditEntryPayload }) {
  const keys = [...new Set([...Object.keys(e.before ?? {}), ...Object.keys(e.after ?? {})])];
  if (keys.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <ul className="space-y-0.5 text-xs">
      {keys.slice(0, 6).map((k) => (
        <li key={k}>
          <span className="font-mono text-muted-foreground">{k}</span>{' '}
          <span className="text-muted-foreground">{show(e.before?.[k])}</span> →{' '}
          <span className="font-medium">{show(e.after?.[k])}</span>
        </li>
      ))}
      {keys.length > 6 && <li className="text-muted-foreground">+{keys.length - 6} more</li>}
    </ul>
  );
}

/**
 * The audit log (Day 39): every credit override, and every change to the company profile, the
 * business rules and the numbering — who, when, from where, and exactly what changed. Read-only;
 * entries are never edited or deleted.
 */
export function AuditLogScreen() {
  const [action, setAction] = useState<'' | AuditAction>('');
  const [text, setText] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebouncedValue(text.trim(), 250);
  const { data, isLoading, isFetching } = useAudit({
    page,
    limit: 25,
    action: action || undefined,
    q: q || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  const columns: Column<AuditEntryPayload>[] = [
    {
      key: 'at',
      header: 'When',
      cell: (e) => (
        <div className="text-sm">
          <p>{new Date(e.at).toLocaleString()}</p>
          {e.ip && <p className="font-mono text-xs text-muted-foreground">{e.ip}</p>}
        </div>
      ),
    },
    {
      key: 'who',
      header: 'Who',
      cell: (e) => <span className="font-medium">{e.actorName ?? '—'}</span>,
    },
    {
      key: 'action',
      header: 'What',
      cell: (e) => (
        <div>
          <StatusPill
            status={e.action}
            tone={e.action === 'CREDIT_OVERRIDE' ? 'warning' : 'info'}
            label={ACTION_LABEL[e.action] ?? humanise(e.action)}
          />
          {e.docNo && (
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">{e.docNo}</p>
          )}
        </div>
      ),
    },
    { key: 'changes', header: 'Change', cell: (e) => <Changes e={e} /> },
    {
      key: 'reason',
      header: 'Reason',
      cell: (e) => <span className="text-sm">{e.reason ?? '—'}</span>,
    },
  ];

  const reset =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(1);
    };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit log"
        icon={ScrollText}
        description="Credit overrides and every change to the company, the business rules and the numbering — who, when and what."
      />
      <div className="flex flex-wrap items-end gap-2">
        <div className="relative w-60">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={text}
            onChange={(e) => reset(setText)(e.target.value)}
            placeholder="Who, document, reason…"
            className="pl-9"
            aria-label="Search the log"
          />
        </div>
        <Select
          value={action}
          onChange={(e) => reset(setAction)(e.target.value as '' | AuditAction)}
          className="w-48"
          aria-label="Action"
        >
          <option value="">Every action</option>
          {AUDIT_ACTIONS.map((a) => (
            <option key={a} value={a}>
              {ACTION_LABEL[a]}
            </option>
          ))}
        </Select>
        <Input
          type="date"
          value={from}
          onChange={(e) => reset(setFrom)(e.target.value)}
          className="w-40"
          aria-label="From"
        />
        <Input
          type="date"
          value={to}
          onChange={(e) => reset(setTo)(e.target.value)}
          className="w-40"
          aria-label="To"
        />
      </div>
      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(e) => e.id}
        isLoading={isLoading}
        isFetching={isFetching}
        meta={data?.meta}
        onPageChange={setPage}
        empty={<EmptyState icon={ScrollText} title="Nothing logged" />}
      />
    </div>
  );
}
