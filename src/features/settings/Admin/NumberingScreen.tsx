import { Hash, Loader2, Lock } from 'lucide-react';
import { useState } from 'react';

import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePermission } from '@/hooks/data/useAuth';
import { useNumberSeries, useUpdateNumberSeries } from '@/hooks/data/useAdmin';

import { RESET_POLICIES, SERIES_EDITABLE_LIMITS as L } from '@shared/numbering';

import type { DocSeries } from '@shared/enums';
import type { ResetPolicy } from '@shared/numbering';
import type { NumberSeriesPayload } from '@shared/types';

/** What each series numbers, in words. */
const SERIES_LABEL: Record<DocSeries, string> = {
  WS: 'Wholesale invoice',
  POS: 'Counter invoice',
  SO: 'Wholesale order',
  CHL: 'Challan',
  PO: 'Purchase order',
  GRN: 'Goods receipt',
  RCPT: 'Receipt',
  PAY: 'Payment out',
  CN: 'Credit note',
  SR: 'Sales return',
  DN: 'Debit note (purchase return)',
  ADJ: 'Stock adjustment',
  TRF: 'Stock transfer',
  DLR: 'Party code',
  CNT: 'Stock count',
  OB: 'Opening-balance invoice',
};

const RESET_LABEL: Record<ResetPolicy, string> = {
  NEVER: 'Never',
  YEARLY: 'Each financial year',
  MONTHLY: 'Each month',
};

/**
 * Document numbering (Day 39): how each series prints — prefix, padding, separator, and when the
 * count restarts. A change applies to the next number only; numbers already issued never change.
 * Every change is in the audit log.
 */
export function NumberingScreen() {
  const canEdit = usePermission('settings:manage');
  const { data, isLoading } = useNumberSeries();
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        title="Document numbering"
        icon={Hash}
        description="How each kind of document is numbered. Changes apply from the next number; nothing already issued changes."
      />
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Prefix</TableHead>
                  <TableHead>Separator</TableHead>
                  <TableHead>Digits</TableHead>
                  <TableHead>Restarts</TableHead>
                  <TableHead>Next number</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((s) => (
                  <SeriesRow
                    key={`${s.series}-${s.prefix}-${s.padding}-${s.resetPolicy}-${s.separator}`}
                    s={s}
                    canEdit={canEdit}
                  />
                ))}
              </TableBody>
            </Table>
          )}
          {!canEdit && (
            <p className="mt-3 text-sm text-muted-foreground">
              You need <code className="font-mono text-xs">settings:manage</code> to change
              numbering.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SeriesRow({ s, canEdit }: { s: NumberSeriesPayload; canEdit: boolean }) {
  const [prefix, setPrefix] = useState(s.prefix);
  const [separator, setSeparator] = useState(s.separator);
  const [padding, setPadding] = useState(String(s.padding));
  const [reset, setReset] = useState<ResetPolicy>(s.resetPolicy);
  const save = useUpdateNumberSeries();
  const editable = canEdit && !s.locked;
  const dirty =
    prefix !== s.prefix ||
    separator !== s.separator ||
    Number(padding) !== s.padding ||
    reset !== s.resetPolicy;

  return (
    <TableRow>
      <TableCell>
        <p className="font-medium">{SERIES_LABEL[s.series] ?? s.series}</p>
        <p className="font-mono text-xs text-muted-foreground">
          {s.series}
          {!s.configured && ' · defaults'}
        </p>
      </TableCell>
      <TableCell>
        <Input
          value={prefix}
          onChange={(e) => setPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          maxLength={L.prefixMax}
          className="w-24 font-mono"
          disabled={!editable}
          aria-label={`${s.series} prefix`}
        />
      </TableCell>
      <TableCell>
        <Select
          value={separator}
          onChange={(e) => setSeparator(e.target.value)}
          className="w-20"
          disabled={!editable}
          aria-label={`${s.series} separator`}
        >
          <option value="-">-</option>
          <option value="/">/</option>
          <option value="">none</option>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min={L.paddingMin}
          max={L.paddingMax}
          value={padding}
          onChange={(e) => setPadding(e.target.value)}
          className="w-20"
          disabled={!editable}
          aria-label={`${s.series} digits`}
        />
      </TableCell>
      <TableCell>
        <Select
          value={reset}
          onChange={(e) => setReset(e.target.value as ResetPolicy)}
          className="w-44"
          disabled={!editable}
          aria-label={`${s.series} restarts`}
        >
          {RESET_POLICIES.map((r) => (
            <option key={r} value={r}>
              {RESET_LABEL[r]}
            </option>
          ))}
        </Select>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="font-mono">
          {s.nextNumber}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        {s.locked ? (
          <Lock
            className="ml-auto h-4 w-4 text-muted-foreground"
            aria-label="Fixed — party codes cannot change"
          />
        ) : (
          editable && (
            <Button
              size="sm"
              variant={dirty ? 'default' : 'ghost'}
              disabled={!dirty || save.isPending || !prefix}
              onClick={() =>
                save.mutate({
                  series: s.series,
                  body: {
                    prefix,
                    separator: separator as '-' | '/' | '',
                    padding: Number(padding),
                    resetPolicy: reset,
                  },
                })
              }
            >
              {save.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              Save
            </Button>
          )
        )}
      </TableCell>
    </TableRow>
  );
}
