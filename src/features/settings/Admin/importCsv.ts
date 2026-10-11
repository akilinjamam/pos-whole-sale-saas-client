import Papa from 'papaparse';

import { toMinor } from '@shared/money';

import type { OpeningBalanceRow } from '@shared/ledger';
import type { OpeningRow } from '@shared/stock';

/**
 * Reading the cut-over files (Day 39) into import rows, before anything is sent. Only what the
 * file itself can get wrong is checked here — a quantity that is not a whole number, a date in
 * the wrong shape. Whether a SKU or a party code exists needs the database: the server's dry run
 * answers that, row by row.
 */

export interface Column {
  key: string;
  required: boolean;
  note: string;
}

export const STOCK_COLUMNS: Column[] = [
  { key: 'sku', required: true, note: 'Product SKU.' },
  { key: 'variantSku', required: false, note: 'A variant SKU, for products with variants.' },
  {
    key: 'uom',
    required: false,
    note: 'Unit the qty is in — base unit or a pack (DOZ). Default: base unit.',
  },
  { key: 'qty', required: true, note: 'Whole number, in that unit.' },
  { key: 'unitCost', required: false, note: 'Cost per base unit, in taka, e.g. 30.00.' },
  { key: 'lotNo', required: false, note: 'Lot-tracked products: the batch.' },
  { key: 'expiryDate', required: false, note: 'YYYY-MM-DD.' },
  { key: 'mfgDate', required: false, note: 'YYYY-MM-DD.' },
  {
    key: 'serials',
    required: false,
    note: 'Serial-tracked products: one per unit, separated by ;',
  },
];

export const BALANCE_COLUMNS: Column[] = [
  { key: 'code', required: true, note: 'The party code, e.g. P-00042.' },
  {
    key: 'balance',
    required: true,
    note: 'In taka. Positive: they owe us. Negative: we owe them (a supplier, or a dealer’s advance).',
  },
  {
    key: 'dueDate',
    required: false,
    note: 'YYYY-MM-DD — when the old invoices fall due. Default: the cut-over date.',
  },
  { key: 'reference', required: false, note: 'The old system’s reference.' },
];

export interface Parsed<R> {
  rows: { line: number; row: R | null; errors: string[] }[];
  fatal: string[];
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const clean = (v: string | undefined) => (v ?? '').trim();

function read(text: string, columns: Column[]) {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });
  const headers = parsed.meta.fields ?? [];
  const missing = columns
    .filter((c) => c.required && !headers.includes(c.key))
    .map((c) => c.key);
  return { data: parsed.data, missing };
}

export function parseStockCsv(text: string): Parsed<OpeningRow> {
  const { data, missing } = read(text, STOCK_COLUMNS);
  if (missing.length) return { rows: [], fatal: [`Missing column(s): ${missing.join(', ')}`] };
  return {
    fatal: [],
    rows: data.map((raw, i) => {
      const line = i + 2; // the header is line 1
      const errors: string[] = [];
      const qty = Number(clean(raw.qty));
      if (!Number.isInteger(qty) || qty < 1)
        errors.push('qty must be a whole number of at least 1');
      const cost = clean(raw.unitCost);
      if (cost && !(Number(cost) >= 0)) errors.push('unitCost is not an amount');
      for (const k of ['expiryDate', 'mfgDate'] as const) {
        if (clean(raw[k]) && !DATE.test(clean(raw[k]))) errors.push(`${k} must be YYYY-MM-DD`);
      }
      if (!clean(raw.sku)) errors.push('sku is required');
      const serials = clean(raw.serials)
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean);
      return {
        line,
        errors,
        row: errors.length
          ? null
          : {
              line,
              sku: clean(raw.sku),
              variantSku: clean(raw.variantSku) || null,
              uomCode: clean(raw.uom) || null,
              qty,
              unitCostMinor: cost ? toMinor(Number(cost)) : null,
              lotNo: clean(raw.lotNo) || null,
              expiryDate: clean(raw.expiryDate) || null,
              mfgDate: clean(raw.mfgDate) || null,
              ...(serials.length ? { serials } : {}),
            },
      };
    }),
  };
}

export function parseBalanceCsv(text: string): Parsed<OpeningBalanceRow> {
  const { data, missing } = read(text, BALANCE_COLUMNS);
  if (missing.length) return { rows: [], fatal: [`Missing column(s): ${missing.join(', ')}`] };
  return {
    fatal: [],
    rows: data.map((raw, i) => {
      const line = i + 2;
      const errors: string[] = [];
      const amount = Number(clean(raw.balance).replace(/,/g, ''));
      if (!clean(raw.code)) errors.push('code is required');
      if (!Number.isFinite(amount) || amount === 0)
        errors.push('balance must be a non-zero amount');
      if (clean(raw.dueDate) && !DATE.test(clean(raw.dueDate)))
        errors.push('dueDate must be YYYY-MM-DD');
      return {
        line,
        errors,
        row: errors.length
          ? null
          : {
              line,
              code: clean(raw.code),
              amountMinor: toMinor(amount),
              dueDate: clean(raw.dueDate) || null,
              reference: clean(raw.reference) || null,
            },
      };
    }),
  };
}

/** A template with the header row, so the person starts from the right columns. */
export function templateCsv(columns: Column[]): string {
  return `${columns.map((c) => c.key).join(',')}\n`;
}
