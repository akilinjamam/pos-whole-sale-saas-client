import { Download, XCircle } from 'lucide-react';
import { useState } from 'react';

import { fieldErrors } from '@/api/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCan, useCurrentUser } from '@/hooks/data/useAuth';
import { useCloseOrg, useExportData, useOrg } from '@/hooks/data/useOrg';

import type { SubscriptionPayload } from '@shared/types';

/** "Download my data" — also used on the closed-account screen. */
export function ExportButton({ className }: { className?: string }) {
  const exportData = useExportData();
  return (
    <Button
      variant="outline"
      className={className}
      disabled={exportData.isPending}
      onClick={() => exportData.mutate()}
    >
      <Download aria-hidden="true" />
      {exportData.isPending ? 'Preparing your data…' : 'Download my data'}
    </Button>
  );
}

/**
 * Settings → Subscription, bottom (SaaS phase 7): take everything out, and — for the owner only —
 * close the business.
 */
export function DataAndClosing({ data }: { data: SubscriptionPayload }) {
  const can = useCan();
  const user = useCurrentUser();
  const [closing, setClosing] = useState(false);
  const isOwner = Boolean(user && data.ownerUserId === user.id);

  if (!can('org:export') && !isOwner) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your data</CardTitle>
        <CardDescription>
          Your records belong to you. Download all of them at any time — products, dealers,
          orders, invoices, payments, stock and the ledgers — as JSON and spreadsheet (CSV) files
          in one zip.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        {can('org:export') ? <ExportButton /> : <span />}
        {isOwner && (
          <Button variant="ghost" className="text-destructive" onClick={() => setClosing(true)}>
            <XCircle aria-hidden="true" />
            Close this business
          </Button>
        )}
      </CardContent>
      {closing && <CloseDialog onClose={() => setClosing(false)} />}
    </Card>
  );
}

function CloseDialog({ onClose }: { onClose: () => void }) {
  const { data: org } = useOrg();
  const close = useCloseOrg();
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const name = org?.name ?? '';
  const matches = businessName.trim().toLowerCase() === name.trim().toLowerCase();

  const submit = () =>
    close.mutate(
      { businessName, password, reason: reason.trim() || null },
      {
        onSuccess: onClose,
        onError: (error) =>
          setErrors(Object.fromEntries(fieldErrors(error).map((f) => [f.path, f.message]))),
      },
    );

  return (
    <Dialog
      open
      onClose={onClose}
      title="Close this business"
      description="Everyone in the business loses access at once."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Keep my business
          </Button>
          <Button
            variant="destructive"
            disabled={!matches || !password || close.isPending}
            onClick={submit}
          >
            Close it
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Nobody can sign in to work any more; sales, orders and stock stop.</li>
          <li>
            Your data is kept for a while, then deleted for good — you will see the exact date,
            and get it by email, once the business is closed.
          </li>
          <li>Until then you can still sign in to download it, or ask us to reopen.</li>
        </ul>
        <p>Download your data first if you may need it later.</p>
        <Field
          label={`Type the business name: ${name}`}
          required
          error={errors.businessName}
        >
          {(p) => (
            <Input
              {...p}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              autoComplete="off"
            />
          )}
        </Field>
        <Field label="Your password" required error={errors.password}>
          {(p) => (
            <Input
              {...p}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          )}
        </Field>
        <Field label="Why are you leaving? (optional)">
          {(p) => (
            <Textarea
              {...p}
              rows={2}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          )}
        </Field>
      </div>
    </Dialog>
  );
}
