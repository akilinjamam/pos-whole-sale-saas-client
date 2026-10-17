import { api, deleteData, getData, patchData, postData } from '@/api/client';

import type { BillingCycle } from '@shared/enums';
import type {
  OnboardingPayload,
  OrgPayload,
  OrgSettings,
  SubscriptionPayload,
} from '@shared/types';

/** "The org" is always the caller's own business, taken from their token. No id. */
/**
 * Silent: screens fetch the company profile in the background for their print letterhead, and a
 * role without `org:read` (a store keeper on a challan) would otherwise get a "no permission" toast
 * about something they never clicked — beside the refusal they did need to read.
 */
export function fetchOrg(): Promise<OrgPayload> {
  return getData<OrgPayload>('/org', undefined, { silent: true });
}

export type UpdateOrgBody = Partial<
  Pick<
    OrgPayload,
    | 'name'
    | 'legalName'
    | 'bin'
    | 'vatRegNo'
    | 'tin'
    | 'phone'
    | 'email'
    | 'address'
    | 'logoUrl'
    | 'invoiceHeaderNote'
    | 'invoiceFooter'
    | 'currency'
    | 'timeZone'
    | 'fiscalYearStartMonth'
  >
>;

export function updateOrg(body: UpdateOrgBody): Promise<OrgPayload> {
  return patchData<OrgPayload>('/org', body);
}

/**
 * The business-rule flags, on their own endpoint and behind `settings:manage`.
 *
 * Separate from the profile PATCH because these change *posting behaviour* — whether a
 * dispatch raises an invoice, whether stock may go negative, whether a credit limit stops an
 * order — and the audit trail should read "changed allowNegativeStock", not "updated company".
 */
export type UpdateOrgSettingsBody = Partial<OrgSettings>;

export function updateOrgSettings(body: UpdateOrgSettingsBody): Promise<OrgPayload> {
  return patchData<OrgPayload>('/org/settings', body);
}

/** The first-steps checklist on the dashboard. Silent for the same reason as `fetchOrg`. */
export function fetchOnboarding(): Promise<OnboardingPayload> {
  return getData<OnboardingPayload>('/org/onboarding', undefined, { silent: true });
}

export function dismissOnboarding(): Promise<OnboardingPayload> {
  return postData<OnboardingPayload>('/org/onboarding/dismiss');
}

/**
 * Plan, status and usage (SaaS phase 4). Every signed-in user may read it — the banner needs it on
 * every screen — and it answers even for a read-only or suspended business. Silent: it is chrome.
 */
export function fetchSubscription(): Promise<SubscriptionPayload> {
  return getData<SubscriptionPayload>('/org/subscription', undefined, { silent: true });
}

export interface PlanRequestBody {
  planCode: string;
  cycle: BillingCycle;
  note?: string | null;
}

/** Ask the platform for a plan. Nothing changes until the payment is recorded. */
export function requestPlan(body: PlanRequestBody): Promise<SubscriptionPayload> {
  return postData<SubscriptionPayload>('/org/subscription/plan-request', body);
}

export function withdrawPlanRequest(): Promise<SubscriptionPayload> {
  return deleteData<SubscriptionPayload>('/org/subscription/plan-request');
}

/**
 * Every record of the business as a zip (SaaS phase 7). A blob, not the JSON envelope — so it is
 * silent, and an error (which arrives as a blob too) is read back into a message here.
 */
export async function downloadExport(): Promise<{ blob: Blob; filename: string }> {
  try {
    const res = await api.get<Blob>('/org/export', {
      responseType: 'blob',
      _silent: true,
    } as Parameters<typeof api.get>[1]);
    const disposition = String(res.headers['content-disposition'] ?? '');
    const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'business-export.zip';
    return { blob: res.data, filename };
  } catch (error) {
    const data = (error as { response?: { data?: unknown } }).response?.data;
    let message = 'The download failed — try again';
    if (data instanceof Blob) {
      try {
        const body = JSON.parse(await data.text()) as { error?: { message?: string } };
        message = body.error?.message ?? message;
      } catch {
        /* not JSON — keep the generic message */
      }
    }
    throw new Error(message);
  }
}

export interface CloseOrgBody {
  businessName: string;
  password: string;
  reason?: string | null;
}

/** The owner closes the business. Answers with the subscription, now CANCELLED. */
export function closeOrg(body: CloseOrgBody): Promise<SubscriptionPayload> {
  return postData<SubscriptionPayload>('/org/close', body);
}
