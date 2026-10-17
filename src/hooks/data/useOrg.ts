import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'sonner';

import {
  closeOrg,
  dismissOnboarding,
  downloadExport,
  fetchOnboarding,
  fetchOrg,
  fetchSubscription,
  requestPlan,
  updateOrg,
  updateOrgSettings,
  withdrawPlanRequest,
} from '@/api/endpoints/org';

import type {
  CloseOrgBody,
  PlanRequestBody,
  UpdateOrgBody,
  UpdateOrgSettingsBody,
} from '@/api/endpoints/org';
import type { PlanFeature } from '@shared/enums';

export const orgKeys = {
  all: ['org'] as const,
  onboarding: ['org', 'onboarding'] as const,
  subscription: ['org', 'subscription'] as const,
};

/** `enabled: false` for chrome that should not ask at all when the user lacks `org:read`. */
export function useOrg(enabled = true) {
  return useQuery({
    queryKey: orgKeys.all,
    queryFn: fetchOrg,
    enabled,
    // The company profile changes a handful of times in the system's life, and its `settings`
    // are read by several screens. Cache it for the session rather than per screen.
    staleTime: 5 * 60_000,
  });
}

export function useUpdateOrg() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateOrgBody) => updateOrg(body),
    onSuccess: (org) => {
      // `setQueryData` rather than an invalidate: the response *is* the new org, so there is
      // nothing to go and fetch.
      queryClient.setQueryData(orgKeys.all, org);
      // The checklist's "company details" step reads the phone and address just saved.
      void queryClient.invalidateQueries({ queryKey: orgKeys.onboarding });
      toast.success('Company profile saved');
    },
  });
}

export function useUpdateOrgSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateOrgSettingsBody) => updateOrgSettings(body),
    onSuccess: (org) => {
      queryClient.setQueryData(orgKeys.all, org);
      toast.success('Business rules updated');
    },
  });
}

/**
 * The first-steps checklist. Short-lived on purpose: each step ticks itself when the data appears
 * (a product saved, a dealer added), and the dashboard is where people come back to see it.
 */
export function useOnboarding(enabled: boolean) {
  return useQuery({
    queryKey: orgKeys.onboarding,
    queryFn: fetchOnboarding,
    enabled,
    staleTime: 30_000,
  });
}

export function useDismissOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dismissOnboarding(),
    onSuccess: (data) => queryClient.setQueryData(orgKeys.onboarding, data),
  });
}

/**
 * The business's plan and subscription state (SaaS phase 4). Re-read on focus and every few
 * minutes, so a business that has just paid — or just run out — sees the change without a reload.
 */
export function useSubscription() {
  return useQuery({
    queryKey: orgKeys.subscription,
    queryFn: fetchSubscription,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    refetchOnWindowFocus: true,
  });
}

/** Ask for a plan, or take the request back. The response is the whole subscription. */
export function useRequestPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PlanRequestBody) => requestPlan(body),
    onSuccess: (data) => {
      queryClient.setQueryData(orgKeys.subscription, data);
      toast.success('Request sent — we will be in touch about payment');
    },
  });
}

export function useWithdrawPlanRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => withdrawPlanRequest(),
    onSuccess: (data) => {
      queryClient.setQueryData(orgKeys.subscription, data);
      toast.success('Request withdrawn');
    },
  });
}

/** Download every record of the business as a zip, and hand it to the browser. */
export function useExportData() {
  return useMutation({
    mutationFn: downloadExport,
    onSuccess: ({ blob, filename }) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
      toast.success('Your data has been downloaded');
    },
    onError: (error) => toast.error(error.message),
  });
}

/** The owner closes the business. The new subscription (CANCELLED) swaps in the closed screen. */
export function useCloseOrg() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CloseOrgBody) => closeOrg(body),
    onSuccess: (data) => queryClient.setQueryData(orgKeys.subscription, data),
  });
}

/**
 * Whether the business's plan includes a feature — for hiding a module the plan leaves out. Never
 * the thing that protects it: the server refuses with FEATURE_NOT_IN_PLAN either way.
 *
 * Until the subscription has loaded, and for a business with no plan, everything is allowed —
 * hiding the menu and then showing it again would be worse than the rare refusal.
 */
export function usePlanFeatures(): (feature: PlanFeature | undefined) => boolean {
  const { data } = useSubscription();
  const features = data?.plan?.features;
  return useCallback(
    (feature: PlanFeature | undefined) => !feature || !features || features.includes(feature),
    [features],
  );
}
