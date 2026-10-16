import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import { fieldErrors } from '@/api/client';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusPill } from '@/components/common/StatusPill';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
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
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { ORG_STATUSES } from '@shared/enums';

import { STATUS_LABEL, STATUS_TONE, day, dayTime, timeLeft } from '../format';
import { useCreateTenant, usePlatformPlans, useTenants } from '../hooks';

import type { OrgStatus } from '@shared/enums';

const LIMIT = 25;

/** `/platform/tenants` — every business on the platform. */
export function TenantsList() {
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') as OrgStatus | null) ?? undefined;
  const page = Number(params.get('page') ?? 1);
  const [q, setQ] = useState(params.get('q') ?? '');
  const search = useDebouncedValue(q.trim(), 300);
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useTenants({
    page,
    limit: LIMIT,
    q: search || undefined,
    status,
  });

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Businesses"
        icon={Building2}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden="true" />
            New business
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, slug or owner email"
          className="max-w-xs"
          aria-label="Search businesses"
        />
        <div className="w-44">
          <Select
            value={status ?? ''}
            onChange={(e) => setParam('status', e.target.value || null)}
            aria-label="Filter by status"
          >
            <option value="">Every status</option>
            {ORG_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No businesses match"
          description="Try another search or status."
        />
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time left</TableHead>
                <TableHead className="text-right">Users</TableHead>
                <TableHead>Last active</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <Link
                      to={`/platform/tenants/${t.id}`}
                      className="font-medium hover:underline"
                    >
                      {t.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{t.slug ?? '—'}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.ownerEmail ?? '—'}
                    {t.ownerEmail && !t.ownerEmailVerified && (
                      <div className="text-xs text-amber-700 dark:text-amber-400">
                        not verified
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{t.planName ?? 'No plan'}</TableCell>
                  <TableCell>
                    <StatusPill
                      status={t.status}
                      tone={STATUS_TONE[t.status]}
                      label={STATUS_LABEL[t.status]}
                    />
                  </TableCell>
                  <TableCell className="text-sm">{timeLeft(t)}</TableCell>
                  <TableCell className="text-right tabular-nums">{t.usage.users}</TableCell>
                  <TableCell className="text-sm">{dayTime(t.lastActiveAt)}</TableCell>
                  <TableCell className="text-sm">{day(t.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <span className="text-muted-foreground">
            Page {data.meta.page} of {data.meta.totalPages} · {data.meta.total} businesses
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setParam('page', String(page - 1))}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= data.meta.totalPages}
            onClick={() => setParam('page', String(page + 1))}
          >
            Next
          </Button>
        </div>
      )}

      {creating && <CreateTenantDialog onClose={() => setCreating(false)} />}
    </div>
  );
}

const createSchema = z.object({
  businessName: z.string().trim().min(2, 'At least 2 characters').max(120),
  ownerName: z.string().trim().min(1, 'Required').max(120),
  ownerEmail: z.string().trim().email('Enter a valid email'),
  ownerPhone: z.string().trim().max(40),
  password: z.string().min(8, 'At least 8 characters').max(128),
  planCode: z.string().min(1, 'Choose a plan'),
  status: z.enum(['TRIAL', 'ACTIVE']),
  trialDays: z.coerce.number().int().min(1).max(365),
});
type CreateValues = z.infer<typeof createSchema>;

function CreateTenantDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const create = useCreateTenant();
  const { data: plans } = usePlatformPlans();
  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      businessName: '',
      ownerName: '',
      ownerEmail: '',
      ownerPhone: '',
      password: '',
      planCode: '',
      status: 'TRIAL',
      trialDays: 14,
    },
  });
  const errors = form.formState.errors;
  const isTrial = useWatch({ control: form.control, name: 'status' }) === 'TRIAL';

  const onSubmit = form.handleSubmit((v) =>
    create.mutate(
      {
        businessName: v.businessName,
        ownerName: v.ownerName,
        ownerEmail: v.ownerEmail,
        ownerPhone: v.ownerPhone || null,
        password: v.password,
        planCode: v.planCode,
        status: v.status,
        ...(v.status === 'TRIAL' ? { trialDays: v.trialDays } : {}),
      },
      {
        onSuccess: (tenant) => navigate(`/platform/tenants/${tenant.id}`),
        onError: (error) => {
          for (const f of fieldErrors(error)) {
            if (f.path in v)
              form.setError(f.path as keyof CreateValues, { message: f.message });
          }
        },
      },
    ),
  );

  return (
    <Dialog
      open
      onClose={onClose}
      title="New business"
      description="The owner signs in with this temporary password and must change it."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void onSubmit()} disabled={create.isPending}>
            Create business
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Business name"
          required
          error={errors.businessName?.message}
          className="sm:col-span-2"
        >
          {(p) => <Input {...p} {...form.register('businessName')} autoFocus />}
        </Field>
        <Field label="Owner name" required error={errors.ownerName?.message}>
          {(p) => <Input {...p} {...form.register('ownerName')} />}
        </Field>
        <Field label="Owner email" required error={errors.ownerEmail?.message}>
          {(p) => <Input {...p} {...form.register('ownerEmail')} type="email" />}
        </Field>
        <Field label="Owner phone" error={errors.ownerPhone?.message}>
          {(p) => <Input {...p} {...form.register('ownerPhone')} type="tel" />}
        </Field>
        <Field label="Temporary password" required error={errors.password?.message}>
          {(p) => <Input {...p} {...form.register('password')} autoComplete="new-password" />}
        </Field>
        <Field label="Plan" required error={errors.planCode?.message}>
          {(p) => (
            <Select {...p} {...form.register('planCode')} placeholder="Choose a plan" required>
              {(plans ?? []).map((plan) => (
                <option key={plan.code} value={plan.code}>
                  {plan.name}
                  {plan.isActive ? '' : ' (not offered)'}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Start as" required error={errors.status?.message}>
          {(p) => (
            <Select {...p} {...form.register('status')}>
              <option value="TRIAL">Free trial</option>
              <option value="ACTIVE">Active — record the first payment next</option>
            </Select>
          )}
        </Field>
        {isTrial && (
          <Field label="Trial days" required error={errors.trialDays?.message}>
            {(p) => (
              <Input {...p} {...form.register('trialDays')} type="number" min={1} max={365} />
            )}
          </Field>
        )}
      </form>
    </Dialog>
  );
}
