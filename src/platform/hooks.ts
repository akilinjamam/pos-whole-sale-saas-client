import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { pget, ppage, ppatch, ppost } from './api';

import type { LimitedResource, OrgStatus, PlanFeature } from '@shared/enums';
import type {
  PlatformAdminPayload,
  PlatformDashboardPayload,
  PlatformLoginResponse,
  PlatformPermission,
  PlatformPlanPayload,
  SubscriptionPaymentMethod,
  SubscriptionPaymentPayload,
  TenantDetailPayload,
  TenantSummaryPayload,
} from '@shared/platform';

/** Every platform query sits under `['platform', …]`, so signing out drops them all at once. */
export const platformKeys = {
  all: ['platform'] as const,
  dashboard: ['platform', 'dashboard'] as const,
  tenants: (params: TenantListParams) => ['platform', 'tenants', params] as const,
  tenant: (id: string) => ['platform', 'tenant', id] as const,
  payments: (params: PaymentListParams) => ['platform', 'payments', params] as const,
  payment: (id: string) => ['platform', 'payment', id] as const,
  plans: ['platform', 'plans'] as const,
  admins: ['platform', 'admins'] as const,
};

// ─── Auth ───────────────────────────────────────────────────────────────────────────────

export function usePlatformLogin() {
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      ppost<PlatformLoginResponse>('/auth/login', body),
  });
}

export function usePlatformChangePassword() {
  return useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      ppost<PlatformLoginResponse>('/auth/password', body),
  });
}

// ─── Businesses ─────────────────────────────────────────────────────────────────────────

export function usePlatformDashboard() {
  return useQuery({
    queryKey: platformKeys.dashboard,
    queryFn: () => pget<PlatformDashboardPayload>('/dashboard'),
  });
}

export interface TenantListParams {
  page: number;
  limit: number;
  q?: string;
  status?: OrgStatus;
  planCode?: string;
}

export function useTenants(params: TenantListParams) {
  return useQuery({
    queryKey: platformKeys.tenants(params),
    queryFn: () => ppage<TenantSummaryPayload>('/tenants', { ...params }),
    placeholderData: keepPreviousData,
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: platformKeys.tenant(id),
    queryFn: () => pget<TenantDetailPayload>(`/tenants/${id}`),
  });
}

/** After any change to a business: the new detail is the answer; lists and the dashboard refetch. */
function useTenantMutation<TBody>(path: (id: string) => string, success: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: TBody }) =>
      ppost<TenantDetailPayload>(path(id), body),
    onSuccess: (tenant) => {
      queryClient.setQueryData(platformKeys.tenant(tenant.id), tenant);
      void queryClient.invalidateQueries({ queryKey: ['platform', 'tenants'] });
      void queryClient.invalidateQueries({ queryKey: platformKeys.dashboard });
      toast.success(success);
    },
  });
}

export const useSuspendTenant = () =>
  useTenantMutation<{ reason: string }>((id) => `/tenants/${id}/suspend`, 'Business suspended');
export const useReactivateTenant = () =>
  useTenantMutation<{ reason: string }>(
    (id) => `/tenants/${id}/reactivate`,
    'Business reactivated',
  );
export const useCancelTenant = () =>
  useTenantMutation<{ reason: string }>((id) => `/tenants/${id}/cancel`, 'Business closed');
export const useChangeTenantPlan = () =>
  useTenantMutation<{ planCode: string }>((id) => `/tenants/${id}/plan`, 'Plan changed');
export const useExtendTrial = () =>
  useTenantMutation<{ days: number }>((id) => `/tenants/${id}/extend-trial`, 'Trial extended');

export interface CreateTenantBody {
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string | null;
  password: string;
  planCode: string;
  status: 'TRIAL' | 'ACTIVE';
  trialDays?: number;
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTenantBody) => ppost<TenantDetailPayload>('/tenants', body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['platform', 'tenants'] });
      void queryClient.invalidateQueries({ queryKey: platformKeys.dashboard });
      toast.success('Business created');
    },
  });
}

// ─── Payments ───────────────────────────────────────────────────────────────────────────

export interface RecordPaymentBody {
  amountMinor: number;
  method: SubscriptionPaymentMethod;
  trxId?: string | null;
  months: number;
  planCode?: string;
  paidAt?: string;
  note?: string | null;
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, body }: { orgId: string; body: RecordPaymentBody }) =>
      ppost<SubscriptionPaymentPayload>(`/tenants/${orgId}/payments`, body),
    onSuccess: (payment) => {
      void queryClient.invalidateQueries({ queryKey: platformKeys.tenant(payment.orgId) });
      void queryClient.invalidateQueries({ queryKey: ['platform', 'tenants'] });
      void queryClient.invalidateQueries({ queryKey: ['platform', 'payments'] });
      void queryClient.invalidateQueries({ queryKey: platformKeys.dashboard });
      toast.success(`Payment recorded — ${payment.receiptNo}`);
    },
  });
}

export interface PaymentListParams {
  page: number;
  limit: number;
  q?: string;
  orgId?: string;
}

export function usePayments(params: PaymentListParams) {
  return useQuery({
    queryKey: platformKeys.payments(params),
    queryFn: () => ppage<SubscriptionPaymentPayload>('/payments', { ...params }),
    placeholderData: keepPreviousData,
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: platformKeys.payment(id),
    queryFn: () => pget<SubscriptionPaymentPayload>(`/payments/${id}`),
  });
}

// ─── Plans ──────────────────────────────────────────────────────────────────────────────

export function usePlatformPlans(enabled = true) {
  return useQuery({
    queryKey: platformKeys.plans,
    queryFn: () => pget<PlatformPlanPayload[]>('/plans'),
    enabled,
  });
}

export interface PlanBody {
  name: string;
  description?: string | null;
  priceMonthlyMinor: number;
  priceYearlyMinor: number;
  limits: Record<LimitedResource, number | null>;
  features: PlanFeature[];
  isActive?: boolean;
  sortOrder?: number;
}

export function useSavePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, body, isNew }: { code: string; body: PlanBody; isNew: boolean }) =>
      isNew
        ? ppost<PlatformPlanPayload>('/plans', { code, ...body })
        : ppatch<PlatformPlanPayload>(`/plans/${code}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformKeys.plans });
      toast.success('Plan saved');
    },
  });
}

// ─── Admins ─────────────────────────────────────────────────────────────────────────────

export function usePlatformAdmins() {
  return useQuery({
    queryKey: platformKeys.admins,
    queryFn: () => pget<PlatformAdminPayload[]>('/admins'),
  });
}

export function useCreateAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      email: string;
      password: string;
      permissions: PlatformPermission[];
    }) => ppost<PlatformAdminPayload>('/admins', body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformKeys.admins });
      toast.success('Admin added — they must change the password at first sign-in');
    },
  });
}

export function useUpdateAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: {
        name?: string;
        permissions?: PlatformPermission[];
        isActive?: boolean;
        password?: string;
      };
    }) => ppatch<PlatformAdminPayload>(`/admins/${id}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformKeys.admins });
      toast.success('Admin updated');
    },
  });
}
