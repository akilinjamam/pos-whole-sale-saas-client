import { CheckCircle2, Download, FileUp, Loader2, Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { importOpeningBalances, importOpeningStock } from '@/api/endpoints/admin';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusPill } from '@/components/common/StatusPill';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { money } from '@/features/dealers/creditMath';
import { LocationFilter } from '@/features/inventory/LocationFilter';
import { downloadCsv } from '@/features/reports/reportCsv';
import { useCan } from '@/hooks/data/useAuth';
import { useQueryClient } from '@tanstack/react-query';

import { BALANCE_COLUMNS, STOCK_COLUMNS, parseBalanceCsv, parseStockCsv } from './importCsv';

import type { Column, Parsed } from './importCsv';
import type { OpeningBalanceRow } from '@shared/ledger';
import type { OpeningRow } from '@shared/stock';
import type { OpeningBalanceImportResult, OpeningImportResult } from '@shared/types';

/**
 * Data import (Day 39): the two cut-over loads — opening stock, and what each party owed or was
 * owed in the old books. Each goes file → local check → the server's **dry run** (every row,
 * what it would post) → post. Nothing posts until the dry run is clean and someone presses Post.
 *
 * Price lists import from Catalog → Price lists, where they are edited.
 */
export function ImportScreen({ kind }: { kind: 'stock' | 'balances' }) {
  const can = useCan();
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        title={kind === 'stock' ? 'Import opening stock' : 'Import opening balances'}
        icon={FileUp}
        description="From the old system, at cut-over. Every file is checked in full before anything posts."
      />
      {kind === 'stock' && can('stock:opening') && <OpeningStockCard />}
      {kind === 'balances' && can('ledger:opening') && <OpeningBalancesCard />}
      <p className="text-xs text-muted-foreground">
        Price lists import from Catalog → Price lists.
      </p>
    </div>
  );
}

function ColumnsHelp({ columns, name }: { columns: Column[]; name: string }) {
  return (
    <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-medium">Columns</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            downloadCsv(
              `${name}-template.csv`,
              columns.map((c) => c.key),
              [],
            )
          }
        >
          <Download aria-hidden="true" />
          Template
        </Button>
      </div>
      <ul className="grid gap-1 sm:grid-cols-2">
        {columns.map((c) => (
          <li key={c.key}>
            <span className="font-mono">{c.key}</span>
            {c.required && <span className="text-destructive">*</span>} — {c.note}
          </li>
        ))}
      </ul>
    </div>
  );
}

function useFile<R>(parse: (text: string) => Parsed<R>) {
  const [parsed, setParsed] = useState<Parsed<R> | null>(null);
  const [name, setName] = useState('');
  const pick = async (file: File | undefined) => {
    if (!file) return;
    setName(file.name);
    setParsed(parse(await file.text()));
  };
  const localErrors = parsed ? parsed.rows.filter((r) => r.errors.length) : [];
  const rows = parsed ? parsed.rows.flatMap((r) => (r.row ? [r.row] : [])) : [];
  return { parsed, name, pick, localErrors, rows, reset: () => setParsed(null) };
}

function FileRow({ onPick, name }: { onPick: (f: File | undefined) => void; name: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed px-4 py-3 text-sm hover:bg-muted/40">
      <Upload className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <span>{name || 'Choose a CSV file…'}</span>
      <input
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={(e) => {
          onPick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </label>
  );
}

function LocalProblems({ parsed }: { parsed: Parsed<unknown> }) {
  const bad = parsed.rows.filter((r) => r.errors.length);
  if (!parsed.fatal.length && !bad.length) return null;
  return (
    <ul className="space-y-1 text-sm text-destructive" role="alert">
      {parsed.fatal.map((m) => (
        <li key={m}>{m}</li>
      ))}
      {bad.slice(0, 20).map((r) => (
        <li key={r.line}>
          Line {r.line}: {r.errors.join('; ')}
        </li>
      ))}
      {bad.length > 20 && <li>…and {bad.length - 20} more line(s).</li>}
    </ul>
  );
}

// ─── Opening stock ──────────────────────────────────────────────────────────────────────

function OpeningStockCard() {
  const qc = useQueryClient();
  const file = useFile(parseStockCsv);
  const [locationId, setLocationId] = useState('');
  const [asOf, setAsOf] = useState('');
  const [result, setResult] = useState<OpeningImportResult | null>(null);
  const [pending, setPending] = useState(false);

  const run = async (dryRun: boolean) => {
    setPending(true);
    try {
      const r = await importOpeningStock({
        locationId,
        ...(asOf ? { asOf } : {}),
        rows: file.rows as OpeningRow[],
        dryRun,
      });
      setResult(r);
      if (!dryRun) {
        toast.success(`${r.posted} row(s) of opening stock posted as ${r.refDocNo}`);
        void qc.invalidateQueries({ queryKey: ['stock'] });
        file.reset();
      }
    } catch {
      // The API client has already said why.
    } finally {
      setPending(false);
    }
  };

  const ready = file.rows.length > 0 && file.localErrors.length === 0 && locationId;
  const clean = result?.dryRun && result.failed === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Opening stock</CardTitle>
        <CardDescription>
          What is on the shelves at cut-over, one location per file. Posts as OPENING movements
          in the stock ledger.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ColumnsHelp columns={STOCK_COLUMNS} name="opening-stock" />
        <div className="grid gap-3 sm:grid-cols-[1fr_12rem_10rem]">
          <FileRow
            name={file.name}
            onPick={(f) => {
              setResult(null);
              void file.pick(f);
            }}
          />
          <LocationFilter
            value={locationId}
            onChange={setLocationId}
            includeAll={false}
            excludeTransit
            className="w-full"
          />
          <Input
            type="date"
            value={asOf}
            onChange={(e) => setAsOf(e.target.value)}
            aria-label="Cut-over date"
            title="Cut-over date (default today)"
          />
        </div>
        {file.parsed && <LocalProblems parsed={file.parsed} />}
        {result && (
          <ResultTable
            dryRun={result.dryRun}
            rows={result.rows.map((r) => ({
              line: r.line,
              status: r.status,
              errors: r.errors,
              what: r.productName
                ? `${r.productName}${r.variantLabel ? ` · ${r.variantLabel}` : ''}`
                : '',
              detail: r.qtyBase !== undefined ? `${r.qtyBase} base units` : '',
            }))}
          />
        )}
        <div className="flex items-center justify-end gap-2">
          {file.parsed && (
            <span className="mr-auto text-sm text-muted-foreground">
              {file.rows.length} row(s) read
            </span>
          )}
          <Button variant="outline" disabled={!ready || pending} onClick={() => void run(true)}>
            {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Check (dry run)
          </Button>
          <Button disabled={!ready || !clean || pending} onClick={() => void run(false)}>
            <CheckCircle2 aria-hidden="true" />
            Post {file.rows.length || ''} row(s)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Opening balances ───────────────────────────────────────────────────────────────────

function OpeningBalancesCard() {
  const qc = useQueryClient();
  const file = useFile(parseBalanceCsv);
  const [asOf, setAsOf] = useState('');
  const [result, setResult] = useState<OpeningBalanceImportResult | null>(null);
  const [pending, setPending] = useState(false);

  const run = async (dryRun: boolean) => {
    setPending(true);
    try {
      const r = await importOpeningBalances({
        ...(asOf ? { asOf } : {}),
        rows: file.rows as OpeningBalanceRow[],
        dryRun,
      });
      setResult(r);
      if (!dryRun) {
        toast.success(`${r.posted} opening balance(s) posted`);
        for (const key of ['parties', 'receivables', 'purchasing'])
          void qc.invalidateQueries({ queryKey: [key] });
        file.reset();
      }
    } catch {
      // The API client has already said why.
    } finally {
      setPending(false);
    }
  };

  const ready = file.rows.length > 0 && file.localErrors.length === 0;
  const clean = result?.dryRun && result.failed === 0;
  const CREATES = {
    INVOICE: 'Opening invoice',
    ADVANCE: 'Advance on account',
    PAYABLE: 'Owed to supplier',
  } as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Opening balances</CardTitle>
        <CardDescription>
          What each dealer owed us — or we owed a supplier — at cut-over, by party code. A
          dealer’s balance becomes an opening invoice that receipts and ageing work against.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ColumnsHelp columns={BALANCE_COLUMNS} name="opening-balances" />
        <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
          <FileRow
            name={file.name}
            onPick={(f) => {
              setResult(null);
              void file.pick(f);
            }}
          />
          <Input
            type="date"
            value={asOf}
            onChange={(e) => setAsOf(e.target.value)}
            aria-label="Cut-over date"
            title="Cut-over date (default today)"
          />
        </div>
        {file.parsed && <LocalProblems parsed={file.parsed} />}
        {result && (
          <>
            <ResultTable
              dryRun={result.dryRun}
              rows={result.rows.map((r) => ({
                line: r.line,
                status: r.status,
                errors: r.errors,
                what: `${r.code}${r.partyName ? ` · ${r.partyName}` : ''}`,
                detail: [
                  r.amountMinor !== undefined ? money(Math.abs(r.amountMinor)) : '',
                  r.side ?? '',
                  r.creates ? CREATES[r.creates] : '',
                  r.docNo ?? '',
                ]
                  .filter(Boolean)
                  .join(' · '),
              }))}
            />
            <p className="text-right text-sm text-muted-foreground">
              Net {result.netMinor >= 0 ? 'owed to us' : 'owed by us'}:{' '}
              <span className="font-medium tabular-nums text-foreground">
                {money(Math.abs(result.netMinor))}
              </span>
            </p>
          </>
        )}
        <div className="flex items-center justify-end gap-2">
          {file.parsed && (
            <span className="mr-auto text-sm text-muted-foreground">
              {file.rows.length} row(s) read
            </span>
          )}
          <Button variant="outline" disabled={!ready || pending} onClick={() => void run(true)}>
            {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Check (dry run)
          </Button>
          <Button disabled={!ready || !clean || pending} onClick={() => void run(false)}>
            <CheckCircle2 aria-hidden="true" />
            Post {file.rows.length || ''} balance(s)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ResultTable({
  dryRun,
  rows,
}: {
  dryRun: boolean;
  rows: {
    line: number;
    status: 'POST' | 'ERROR';
    errors: string[];
    what: string;
    detail: string;
  }[];
}) {
  const failed = rows.filter((r) => r.status === 'ERROR').length;
  return (
    <div className="space-y-2">
      <p
        className={
          failed ? 'text-sm font-medium text-destructive' : 'text-sm font-medium text-success'
        }
      >
        {dryRun
          ? failed
            ? `${failed} row(s) would be refused — fix the file and check again. Nothing has been posted.`
            : `All ${rows.length} row(s) check out. Nothing has been posted yet.`
          : `Posted.`}
      </p>
      <div className="max-h-80 overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Line</TableHead>
              <TableHead>Row</TableHead>
              <TableHead>Becomes</TableHead>
              <TableHead className="w-28">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...rows]
              .sort((a, b) =>
                a.status === b.status ? a.line - b.line : a.status === 'ERROR' ? -1 : 1,
              )
              .map((r) => (
                <TableRow key={r.line}>
                  <TableCell className="tabular-nums">{r.line}</TableCell>
                  <TableCell className="text-sm">
                    {r.what}
                    {r.errors.length > 0 && (
                      <p className="text-xs text-destructive">{r.errors.join('; ')}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.detail}</TableCell>
                  <TableCell>
                    <StatusPill
                      status={r.status}
                      tone={r.status === 'ERROR' ? 'danger' : 'success'}
                      label={r.status === 'ERROR' ? 'Refused' : dryRun ? 'Will post' : 'Posted'}
                    />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
