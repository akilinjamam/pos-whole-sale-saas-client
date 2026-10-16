import dayjs from 'dayjs';

import { money } from '@/features/dealers/creditMath';

import type { StatusTone } from '@/components/common/StatusPill';
import type { OrgStatus } from '@shared/enums';
import type { SubscriptionPaymentMethod } from '@shared/platform';

export { money };

export const day = (iso: string | null | undefined) =>
  iso ? dayjs(iso).format('D MMM YYYY') : '—';
export const dayTime = (iso: string | null | undefined) =>
  iso ? dayjs(iso).format('D MMM YYYY, HH:mm') : '—';

export const STATUS_LABEL: Record<OrgStatus, string> = {
  TRIAL: 'Trial',
  ACTIVE: 'Active',
  PAST_DUE: 'Payment due',
  SUSPENDED: 'Suspended',
  CANCELLED: 'Closed',
};

export const STATUS_TONE: Record<OrgStatus, StatusTone> = {
  TRIAL: 'info',
  ACTIVE: 'success',
  PAST_DUE: 'warning',
  SUSPENDED: 'danger',
  CANCELLED: 'neutral',
};

export const METHOD_LABEL: Record<SubscriptionPaymentMethod, string> = {
  BKASH: 'bKash',
  NAGAD: 'Nagad',
  BANK: 'Bank transfer',
  CASH: 'Cash',
  OTHER: 'Other',
};

/** "12 days left" / "read-only in 3 days" / "—", for a tenant row. */
export function timeLeft(t: {
  status: OrgStatus;
  access: string;
  daysLeft: number | null;
}): string {
  if (t.access === 'READ_ONLY') return 'Read-only';
  if (t.daysLeft === null) return '—';
  const days = `${t.daysLeft} day${t.daysLeft === 1 ? '' : 's'}`;
  return t.status === 'PAST_DUE' ? `Read-only in ${days}` : `${days} left`;
}
