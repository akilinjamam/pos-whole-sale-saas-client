import { Plus, UserCog } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PLATFORM_PERMISSIONS } from '@shared/platform';

import { dayTime } from '../format';
import { useCreateAdmin, usePlatformAdmins, useUpdateAdmin } from '../hooks';
import { usePlatformAuth } from '../platformAuthContext';

import type { PlatformAdminPayload, PlatformPermission } from '@shared/platform';

const PERMISSION_LABEL: Record<PlatformPermission, string> = {
  'platform:tenants': 'Businesses — create, suspend, change plan, extend trial',
  'platform:billing': 'Payments — record and read',
  'platform:plans': 'Plans — edit prices and limits',
  'platform:admins': 'Admins — add, edit and disable admins',
  'platform:content': 'Tutorials — the training videos customers see',
};

/** `/platform/admins` — the people who run the service. */
export function AdminsPage() {
  const { data, isLoading } = usePlatformAdmins();
  const { admin: me } = usePlatformAuth();
  const update = useUpdateAdmin();
  const [editing, setEditing] = useState<PlatformAdminPayload | 'new' | null>(null);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Admins"
        icon={UserCog}
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus aria-hidden="true" />
            Add admin
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
                <TableHead>Admin</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Last sign-in</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <span className="font-medium">{a.name}</span>
                    <div className="text-xs text-muted-foreground">{a.email}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {a.permissions.map((p) => p.replace('platform:', '')).join(', ')}
                  </TableCell>
                  <TableCell className="text-sm">{dayTime(a.lastLoginAt)}</TableCell>
                  <TableCell>
                    <StatusPill
                      status={a.isActive ? 'ACTIVE' : 'INACTIVE'}
                      tone={a.isActive ? 'success' : 'neutral'}
                      label={a.isActive ? 'Active' : 'Disabled'}
                    />
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button size="sm" variant="outline" onClick={() => setEditing(a)}>
                      Edit
                    </Button>
                    {a.id !== me?.id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={update.isPending}
                        onClick={() =>
                          update.mutate({ id: a.id, body: { isActive: !a.isActive } })
                        }
                      >
                        {a.isActive ? 'Disable' : 'Enable'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {editing && (
        <AdminEditor
          admin={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function AdminEditor({
  admin,
  onClose,
}: {
  admin: PlatformAdminPayload | null;
  onClose: () => void;
}) {
  const create = useCreateAdmin();
  const update = useUpdateAdmin();
  const [name, setName] = useState(admin?.name ?? '');
  const [email, setEmail] = useState(admin?.email ?? '');
  const [password, setPassword] = useState('');
  const [permissions, setPermissions] = useState<PlatformPermission[]>(
    admin?.permissions ?? ['platform:tenants'],
  );
  const [error, setError] = useState<string | null>(null);
  const pending = create.isPending || update.isPending;

  const onError = (e: unknown) =>
    setError(
      fieldErrors(e)
        .map((f) => f.message)
        .join('; ') || null,
    );
  const submit = () => {
    setError(null);
    if (admin) {
      update.mutate(
        { id: admin.id, body: { name, permissions, ...(password ? { password } : {}) } },
        { onSuccess: onClose, onError },
      );
    } else {
      create.mutate({ name, email, password, permissions }, { onSuccess: onClose, onError });
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={admin ? `Edit ${admin.name}` : 'Add a platform admin'}
      description="A new or reset password is temporary — they must change it at sign-in."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || permissions.length === 0}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name" required>
          {(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        {!admin && (
          <Field label="Email" required>
            {(p) => (
              <Input
                {...p}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
          </Field>
        )}
        <Field
          label={admin ? 'Reset password' : 'Temporary password'}
          required={!admin}
          hint={admin ? 'Leave empty to keep the current one' : 'At least 8 characters'}
        >
          {(p) => (
            <Input
              {...p}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          )}
        </Field>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Permissions</legend>
          {PLATFORM_PERMISSIONS.map((perm) => (
            <label key={perm} className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={permissions.includes(perm)}
                onChange={(e) =>
                  setPermissions(
                    e.target.checked
                      ? [...permissions, perm]
                      : permissions.filter((x) => x !== perm),
                  )
                }
              />
              {PERMISSION_LABEL[perm]}
            </label>
          ))}
        </fieldset>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </Dialog>
  );
}
