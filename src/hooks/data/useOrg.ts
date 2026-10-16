import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  dismissOnboarding,
  fetchOnboarding,
  fetchOrg,
  updateOrg,
  updateOrgSettings,
} from '@/api/endpoints/org';

import type { UpdateOrgBody, UpdateOrgSettingsBody } from '@/api/endpoints/org';

export const orgKeys = {
  all: ['org'] as const,
  onboarding: ['org', 'onboarding'] as const,
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
