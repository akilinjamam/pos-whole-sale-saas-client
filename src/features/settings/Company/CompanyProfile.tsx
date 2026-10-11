import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Loader2, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { errorMessage, fieldErrors } from '@/api/client';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { usePermission } from '@/hooks/data/useAuth';
import { usePriceTiers } from '@/hooks/data/usePricing';
import { useOrg, useUpdateOrg, useUpdateOrgSettings } from '@/hooks/data/useOrg';

import type { OrgPayload, OrgSettings } from '@shared/types';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** The rounding steps offered, in minor units. */
const ROUNDING = [
  { value: 0, label: 'No rounding' },
  { value: 50, label: 'To 50 poisha' },
  { value: 100, label: 'To the whole taka' },
  { value: 500, label: 'To ৳5' },
  { value: 1000, label: 'To ৳10' },
];

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Required').max(120),
  legalName: z.string().trim().max(160).optional(),
  bin: z.string().trim().max(40).optional(),
  vatRegNo: z.string().trim().max(40).optional(),
  tin: z.string().trim().max(40).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().email('Not a valid email address').or(z.literal('')),
  address: z.string().trim().max(500).optional(),
  invoiceHeaderNote: z.string().trim().max(200).optional(),
  invoiceFooter: z.string().trim().max(1000).optional(),
  currency: z.string().trim().length(3, 'Three letters, e.g. BDT'),
  timeZone: z.string().trim().min(1, 'Required').max(60),
  fiscalYearStartMonth: z.coerce.number().int().min(1).max(12),
});

type ProfileValues = z.infer<typeof profileSchema>;

/**
 * Company profile and the business-rule flags.
 *
 * Two cards because they are two different permissions and two different kinds of change. The
 * profile is what prints on an invoice; the flags below change *posting behaviour* — whether a
 * dispatch raises an invoice, whether stock may go negative, whether a credit limit stops an
 * order — which is why they sit behind `settings:manage` rather than `org:update`, and why the
 * consequence of each is spelled out next to it rather than left to the field name.
 *
 * The flags are read on hot paths from Day 21 onwards; the screen exists now so that when they
 * start mattering, there is already somewhere to change them.
 */
export function CompanyProfile() {
  const { data: org, isLoading } = useOrg();

  if (isLoading || !org) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <PageHeader title="Company" icon={Building2} />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // The form is mounted only once the org has arrived, so its fields are initialised from real
  // values rather than from blanks that an effect then overwrites. `key` on the org id means a
  // switch of tenant (V2) re-initialises it rather than showing the previous company's details.
  return <CompanyForm key={org.id} org={org} />;
}

function CompanyForm({ org }: { org: OrgPayload }) {
  const canEditProfile = usePermission('org:update');
  const canManageSettings = usePermission('settings:manage');

  const updateOrg = useUpdateOrg();
  const updateSettings = useUpdateOrgSettings();

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: org.name,
      legalName: org.legalName ?? '',
      bin: org.bin ?? '',
      vatRegNo: org.vatRegNo ?? '',
      tin: org.tin ?? '',
      phone: org.phone ?? '',
      email: org.email ?? '',
      address: org.address ?? '',
      invoiceHeaderNote: org.invoiceHeaderNote ?? '',
      invoiceFooter: org.invoiceFooter ?? '',
      currency: org.currency,
      timeZone: org.timeZone,
      fiscalYearStartMonth: org.fiscalYearStartMonth,
    },
  });

  /**
   * Local so a toggle takes effect on screen at once, rather than after the round trip.
   *
   * Seeded from the server's copy and replaced by whatever the mutation returns, so a rejected
   * change does not stick: `useUpdateOrgSettings` writes the response into the query cache, and
   * an outright failure leaves this holding the optimistic value only until the next render
   * from `org` — which is why every flag is sent individually rather than as a batch.
   */
  const [settings, setSettings] = useState<OrgSettings>(org.settings);
  const { data: tiers } = usePriceTiers({ limit: 100, isActive: true }, canManageSettings);

  const onSubmitProfile = form.handleSubmit((values) => {
    // Empty strings become null: the server's schema takes `null` for "not set", and storing ""
    // would print an empty line on an invoice header instead of skipping it.
    const blankToNull = (value?: string) => (value && value.length > 0 ? value : null);

    updateOrg.mutate(
      {
        name: values.name,
        legalName: blankToNull(values.legalName),
        bin: blankToNull(values.bin),
        vatRegNo: blankToNull(values.vatRegNo),
        tin: blankToNull(values.tin),
        phone: blankToNull(values.phone),
        email: blankToNull(values.email),
        address: blankToNull(values.address),
        invoiceHeaderNote: blankToNull(values.invoiceHeaderNote),
        invoiceFooter: blankToNull(values.invoiceFooter),
        currency: values.currency.toUpperCase(),
        timeZone: values.timeZone,
        fiscalYearStartMonth: values.fiscalYearStartMonth,
      },
      {
        onError: (error) => {
          const fields = fieldErrors(error);
          let handled = false;
          for (const field of fields) {
            if (field.path in form.getValues()) {
              form.setError(field.path as keyof ProfileValues, { message: field.message });
              handled = true;
            }
          }
          if (!handled) toast.error(errorMessage(error));
        },
      },
    );
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title="Company"
        icon={Building2}
        description="What prints on your documents, and the rules the system posts by."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>
            This is the header on every invoice, challan and statement.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmitProfile} noValidate className="space-y-4">
            <fieldset disabled={!canEditProfile || updateOrg.isPending} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Trading name"
                  required
                  error={form.formState.errors.name?.message}
                >
                  {(props) => <Input {...props} {...form.register('name')} />}
                </Field>

                <Field label="Legal name" error={form.formState.errors.legalName?.message}>
                  {(props) => <Input {...props} {...form.register('legalName')} />}
                </Field>

                <Field label="BIN" error={form.formState.errors.bin?.message}>
                  {(props) => <Input {...props} {...form.register('bin')} />}
                </Field>

                <Field label="VAT registration" error={form.formState.errors.vatRegNo?.message}>
                  {(props) => <Input {...props} {...form.register('vatRegNo')} />}
                </Field>

                <Field label="TIN" error={form.formState.errors.tin?.message}>
                  {(props) => <Input {...props} {...form.register('tin')} />}
                </Field>

                <Field label="Phone" error={form.formState.errors.phone?.message}>
                  {(props) => <Input {...props} {...form.register('phone')} />}
                </Field>

                <Field label="Email" error={form.formState.errors.email?.message}>
                  {(props) => <Input {...props} {...form.register('email')} type="email" />}
                </Field>

                <Field
                  label="Currency"
                  required
                  hint="ISO code. Amounts are stored in minor units."
                  error={form.formState.errors.currency?.message}
                >
                  {(props) => (
                    <Input {...props} {...form.register('currency')} className="uppercase" />
                  )}
                </Field>

                <Field
                  label="Time zone"
                  required
                  hint="Decides which calendar day a sale belongs to."
                  error={form.formState.errors.timeZone?.message}
                >
                  {(props) => <Input {...props} {...form.register('timeZone')} />}
                </Field>

                <Field
                  label="Financial year starts"
                  error={form.formState.errors.fiscalYearStartMonth?.message}
                >
                  {(props) => (
                    <Select {...props} {...form.register('fiscalYearStartMonth')}>
                      {MONTHS.map((month, index) => (
                        <option key={month} value={index + 1}>
                          {month}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
              </div>

              <Field label="Address" error={form.formState.errors.address?.message}>
                {(props) => <Textarea {...props} {...form.register('address')} rows={2} />}
              </Field>

              <Field
                label="Invoice header note"
                hint="One line under the letterhead on every A4 invoice — e.g. “Authorised distributor of …”."
                error={form.formState.errors.invoiceHeaderNote?.message}
              >
                {(props) => <Input {...props} {...form.register('invoiceHeaderNote')} />}
              </Field>

              <Field
                label="Invoice footer"
                hint="At the foot of every A4 invoice: terms, bank details, a thank-you."
                error={form.formState.errors.invoiceFooter?.message}
              >
                {(props) => (
                  <Textarea {...props} {...form.register('invoiceFooter')} rows={3} />
                )}
              </Field>
            </fieldset>

            {canEditProfile ? (
              <div className="flex justify-end">
                <Button type="submit" disabled={updateOrg.isPending}>
                  {updateOrg.isPending && (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  )}
                  Save profile
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                You need <code className="font-mono text-xs">org:update</code> to change this.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Business rules
          </CardTitle>
          <CardDescription>
            These change how documents post. Each one is read at a specific decision point.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <SettingRow
            label="Invoice on dispatch"
            help="A dispatch raises its invoice as it posts. Turn off to invoice separately, after delivery."
            checked={settings.invoiceOnDispatch}
            disabled={!canManageSettings || updateSettings.isPending}
            onChange={(next) => {
              setSettings({ ...settings, invoiceOnDispatch: next });
              updateSettings.mutate({ invoiceOnDispatch: next });
            }}
          />

          <SettingRow
            label="Allow negative stock"
            help="Let an outward movement take a balance below zero. Off means an oversell is refused with 409 INSUFFICIENT_STOCK — which is almost always what you want."
            checked={settings.allowNegativeStock}
            disabled={!canManageSettings || updateSettings.isPending}
            onChange={(next) => {
              setSettings({ ...settings, allowNegativeStock: next });
              updateSettings.mutate({ allowNegativeStock: next });
            }}
          />

          <SettingRow
            label="Enforce credit limits"
            help="Check a dealer's exposure when an order is confirmed and when a dispatch posts. Off means limits are recorded but never block anything."
            checked={settings.enforceCreditLimit}
            disabled={!canManageSettings || updateSettings.isPending}
            onChange={(next) => {
              setSettings({ ...settings, enforceCreditLimit: next });
              updateSettings.mutate({ enforceCreditLimit: next });
            }}
          />

          <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="round-to" className="text-sm font-medium">
                Round invoice totals
              </label>
              <Select
                id="round-to"
                value={String(settings.roundInvoiceTo)}
                disabled={!canManageSettings || updateSettings.isPending}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setSettings({ ...settings, roundInvoiceTo: next });
                  updateSettings.mutate({ roundInvoiceTo: next });
                }}
              >
                {ROUNDING.some((r) => r.value === settings.roundInvoiceTo) ? null : (
                  <option value={settings.roundInvoiceTo}>
                    To {settings.roundInvoiceTo} poisha
                  </option>
                )}
                {ROUNDING.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">
                To the nearest step, halves up. The difference prints as its own “Rounding”
                line, so the lines still add up.
              </p>
            </div>

            <NumberSetting
              key={`terms-${settings.defaultPaymentTermsDays}`}
              label="Default payment terms (days)"
              help="Used for a dealer with no terms of their own. Drives the due date, and therefore ageing."
              value={settings.defaultPaymentTermsDays}
              disabled={!canManageSettings || updateSettings.isPending}
              onCommit={(next) => {
                setSettings({ ...settings, defaultPaymentTermsDays: next });
                updateSettings.mutate({ defaultPaymentTermsDays: next });
              }}
            />
          </div>

          {!canManageSettings && (
            <p className="text-sm text-muted-foreground">
              You need <code className="font-mono text-xs">settings:manage</code> to change
              these.
            </p>
          )}

          <div className="space-y-1.5 border-t pt-4">
            <label htmlFor="retail-tier" className="text-sm font-medium">
              Counter price tier
            </label>
            <Select
              id="retail-tier"
              value={settings.defaultRetailTierId ?? ''}
              disabled={!canManageSettings || updateSettings.isPending}
              onChange={(e) => {
                const next = e.target.value || null;
                setSettings({ ...settings, defaultRetailTierId: next });
                updateSettings.mutate({ defaultRetailTierId: next });
              }}
            >
              <option value="">None — each product’s own selling price</option>
              {(tiers?.items ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              What a walk-in customer pays at the counter. Dealers are priced by their own tier.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * One flag, saved on toggle.
 *
 * No Save button: each flag is an independent switch on the server (`PATCH /org/settings` takes
 * a partial), and batching them behind a button would mean a half-read screen could silently
 * re-send a stale value for a flag somebody else changed.
 */
function SettingRow({
  label,
  help,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  help: string;
  checked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3">
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className="mt-0.5"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{help}</span>
      </span>
    </label>
  );
}

/**
 * A numeric setting, committed on blur — not on every keystroke.
 *
 * Mounted with `key={value}` by its caller, so the draft is re-seeded from the server's value
 * whenever that changes (after a save, or after another administrator's change arrives) without
 * an effect syncing one piece of state from another. While the user is typing, `value` is
 * unchanged, so the draft is left alone.
 */
function NumberSetting({
  label,
  help,
  value,
  disabled,
  onCommit,
}: {
  label: string;
  help: string;
  value: number;
  disabled: boolean;
  onCommit: (next: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));

  return (
    <Field label={label} hint={help}>
      {(props) => (
        <Input
          {...props}
          type="number"
          min={0}
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            const parsed = Number(draft);
            if (!Number.isInteger(parsed) || parsed < 0) {
              setDraft(String(value));
              return;
            }
            if (parsed !== value) onCommit(parsed);
          }}
        />
      )}
    </Field>
  );
}
