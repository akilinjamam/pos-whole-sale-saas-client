import { Layers, Plus } from 'lucide-react';
import { useState } from 'react';

import { fieldErrors } from '@/api/client';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusPill } from '@/components/common/StatusPill';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LIMITED_RESOURCES, PLAN_FEATURES } from '@shared/enums';
import { fromMinor, toMinor } from '@shared/money';

import { money } from '../format';
import { usePlatformPlans, useSavePlan } from '../hooks';

import type { LimitedResource, PlanFeature } from '@shared/enums';
import type { PlatformPlanPayload } from '@shared/platform';

const FEATURE_LABEL: Record<PlanFeature, string> = {
  POS: 'Counter POS',
  PURCHASING: 'Purchasing',
  REPORTS: 'Reports',
};
const LIMIT_LABEL: Record<LimitedResource, string> = {
  users: 'Users',
  locations: 'Locations',
  products: 'Products',
};

/** `/platform/plans` — the price list. Plans are switched off, never deleted. */
export function PlansPage() {
  const { data, isLoading } = usePlatformPlans();
  const [editing, setEditing] = useState<PlatformPlanPayload | 'new' | null>(null);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Plans"
        icon={Layers}
        description="Changes apply to every business on the plan at once"
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus aria-hidden="true" />
            New plan
          </Button>
        }
      />
      {isLoading || !data ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Monthly</TableHead>
                <TableHead className="text-right">Yearly</TableHead>
                <TableHead>Limits</TableHead>
                <TableHead>Includes</TableHead>
                <TableHead className="text-right">Businesses</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((p) => (
                <TableRow key={p.code}>
                  <TableCell>
                    <span className="font-medium">{p.name}</span>{' '}
                    <span className="text-xs text-muted-foreground">{p.code}</span>
                    {!p.isActive && (
                      <StatusPill
                        status="INACTIVE"
                        tone="neutral"
                        label="Not offered"
                        className="ml-2"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {money(p.priceMonthlyMinor)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {money(p.priceYearlyMinor)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {LIMITED_RESOURCES.map(
                      (r) => `${p.limits[r] ?? '∞'} ${LIMIT_LABEL[r].toLowerCase()}`,
                    ).join(' · ')}
                  </TableCell>
                  <TableCell className="text-sm">
                    {p.features.length
                      ? p.features.map((f) => FEATURE_LABEL[f]).join(', ')
                      : 'Core only'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{p.tenants}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {editing && (
        <PlanEditor
          plan={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function PlanEditor({
  plan,
  onClose,
}: {
  plan: PlatformPlanPayload | null;
  onClose: () => void;
}) {
  const save = useSavePlan();
  const [code, setCode] = useState(plan?.code ?? '');
  const [name, setName] = useState(plan?.name ?? '');
  const [description, setDescription] = useState(plan?.description ?? '');
  const [monthly, setMonthly] = useState(String(plan ? fromMinor(plan.priceMonthlyMinor) : ''));
  const [yearly, setYearly] = useState(String(plan ? fromMinor(plan.priceYearlyMinor) : ''));
  /** Empty means unlimited. */
  const [limits, setLimits] = useState<Record<LimitedResource, string>>({
    users: plan?.limits.users?.toString() ?? '',
    locations: plan?.limits.locations?.toString() ?? '',
    products: plan?.limits.products?.toString() ?? '',
  });
  const [features, setFeatures] = useState<PlanFeature[]>(plan?.features ?? []);
  const [isActive, setIsActive] = useState(plan?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const m = Number(monthly);
    const y = Number(yearly);
    if (!name.trim() || !Number.isFinite(m) || !Number.isFinite(y) || m < 0 || y < 0) {
      setError('Give the plan a name and both prices.');
      return;
    }
    const body = {
      name: name.trim(),
      description: description.trim() || null,
      priceMonthlyMinor: toMinor(m),
      priceYearlyMinor: toMinor(y),
      limits: Object.fromEntries(
        LIMITED_RESOURCES.map((r) => [r, limits[r].trim() === '' ? null : Number(limits[r])]),
      ) as Record<LimitedResource, number | null>,
      features,
      isActive,
    };
    save.mutate(
      { code: code.trim().toUpperCase(), body, isNew: plan === null },
      {
        onSuccess: onClose,
        onError: (e) =>
          setError(
            fieldErrors(e)
              .map((f) => `${f.path}: ${f.message}`)
              .join('; ') || null,
          ),
      },
    );
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={plan ? `Edit ${plan.name}` : 'New plan'}
      description={
        plan
          ? `${plan.tenants} business${plan.tenants === 1 ? '' : 'es'} on it now.`
          : undefined
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={save.isPending}>
            Save plan
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {plan === null && (
          <Field label="Code" required hint="A–Z, 0–9 and _. Cannot be changed later.">
            {(p) => (
              <Input
                {...p}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            )}
          </Field>
        )}
        <Field label="Name" required>
          {(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Field label="Description" className="sm:col-span-2">
          {(p) => (
            <Input
              {...p}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          )}
        </Field>
        <Field label="Monthly price (৳)" required>
          {(p) => (
            <Input
              {...p}
              type="number"
              min="0"
              step="0.01"
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
            />
          )}
        </Field>
        <Field label="Yearly price (৳)" required>
          {(p) => (
            <Input
              {...p}
              type="number"
              min="0"
              step="0.01"
              value={yearly}
              onChange={(e) => setYearly(e.target.value)}
            />
          )}
        </Field>
        {LIMITED_RESOURCES.map((r) => (
          <Field key={r} label={`${LIMIT_LABEL[r]} limit`} hint="Empty for unlimited">
            {(p) => (
              <Input
                {...p}
                type="number"
                min="1"
                value={limits[r]}
                onChange={(e) => setLimits({ ...limits, [r]: e.target.value })}
              />
            )}
          </Field>
        ))}
        <fieldset className="space-y-2 sm:col-span-2">
          <legend className="text-sm font-medium">Includes</legend>
          {PLAN_FEATURES.map((f) => (
            <label key={f} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={features.includes(f)}
                onChange={(e) =>
                  setFeatures(
                    e.target.checked ? [...features, f] : features.filter((x) => x !== f),
                  )
                }
              />
              {FEATURE_LABEL[f]}
            </label>
          ))}
        </fieldset>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <Switch checked={isActive} onCheckedChange={setIsActive} />
          Offered to new businesses
        </label>
        {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      </div>
    </Dialog>
  );
}
