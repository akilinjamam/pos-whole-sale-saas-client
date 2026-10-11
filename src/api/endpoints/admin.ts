import { getData, getPage, patchData, postData } from '@/api/client';

import type { AuditAction, DocSeries } from '@shared/enums';
import type { OpeningBalanceImportInput } from '@shared/ledger';
import type { ResetPolicy } from '@shared/numbering';
import type { OpeningImportInput } from '@shared/stock';
import type {
  AuditEntryPayload,
  NotificationsPayload,
  NumberSeriesPayload,
  OpeningBalanceImportResult,
  OpeningImportResult,
  Paginated,
} from '@shared/types';

/** Administration (Day 39): numbering, the audit log, notifications and the cut-over imports. */

export const listNumberSeries = () => getData<NumberSeriesPayload[]>('/number-series');
export type UpdateSeriesBody = Partial<{
  prefix: string;
  padding: number;
  resetPolicy: ResetPolicy;
  separator: '-' | '/' | '';
}>;
export const updateNumberSeries = (series: DocSeries, body: UpdateSeriesBody) =>
  patchData<NumberSeriesPayload>(`/number-series/${series}`, body);

export type ListAuditParams = {
  page?: number;
  limit?: number;
  q?: string;
  action?: AuditAction;
  from?: string;
  to?: string;
};
export const listAudit = (p: ListAuditParams): Promise<Paginated<AuditEntryPayload>> =>
  getPage<AuditEntryPayload>('/audit', p);

/** Silent: it polls in the background; a failure should not toast every minute. */
export const getNotifications = () =>
  getData<NotificationsPayload>('/notifications', undefined, { silent: true });

export const importOpeningStock = (body: OpeningImportInput) =>
  postData<OpeningImportResult>('/stock/opening', body);
export const importOpeningBalances = (body: OpeningBalanceImportInput) =>
  postData<OpeningBalanceImportResult>('/ledger/opening', body);
