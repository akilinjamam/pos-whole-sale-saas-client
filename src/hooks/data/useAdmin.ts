import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import * as api from '@/api/endpoints/admin';

import type { ListAuditParams, UpdateSeriesBody } from '@/api/endpoints/admin';
import type { DocSeries } from '@shared/enums';

/** Administration (Day 39). */
export const adminKeys = {
  series: ['admin', 'number-series'] as const,
  audit: (p: ListAuditParams) => ['admin', 'audit', p] as const,
};

export const useNumberSeries = () =>
  useQuery({ queryKey: adminKeys.series, queryFn: api.listNumberSeries });

export function useUpdateNumberSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ series, body }: { series: DocSeries; body: UpdateSeriesBody }) =>
      api.updateNumberSeries(series, body),
    onSuccess: (s) => {
      void qc.invalidateQueries({ queryKey: adminKeys.series });
      void qc.invalidateQueries({ queryKey: ['admin', 'audit'] });
      toast.success(`${s.series} numbering saved — next is ${s.nextNumber}`);
    },
  });
}

export const useAudit = (p: ListAuditParams) =>
  useQuery({
    queryKey: adminKeys.audit(p),
    queryFn: () => api.listAudit(p),
    placeholderData: keepPreviousData,
  });

/**
 * The bell (Day 39). Re-asked every two minutes and on focus — these are conditions in the
 * books (stock low, a lot expiring, a dealer overdue), not messages, so polling is enough.
 */
export const useNotifications = (enabled = true) =>
  useQuery({
    queryKey: ['notifications'],
    queryFn: api.getNotifications,
    refetchInterval: 120_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
    enabled,
  });
