import { zodResolver } from '@hookform/resolvers/zod';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { NavLink, Outlet } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { fieldErrors } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { PasswordInput } from '@/features/auth/PasswordInput';
import { cn } from '@/lib/utils';

import { usePlatformChangePassword } from './hooks';
import { usePlatformAuth } from './platformAuthContext';

import type { PlatformPermission } from '@shared/platform';

const NAV: { to: string; label: string; permission: PlatformPermission }[] = [
  { to: '/platform', label: 'Dashboard', permission: 'platform:tenants' },
  { to: '/platform/tenants', label: 'Businesses', permission: 'platform:tenants' },
  { to: '/platform/payments', label: 'Payments', permission: 'platform:billing' },
  { to: '/platform/plans', label: 'Plans', permission: 'platform:plans' },
  { to: '/platform/admins', label: 'Admins', permission: 'platform:admins' },
];

/**
 * The frame around every platform screen (SaaS phase 5). A dark header so it is never mistaken for
 * a business's own screens — the two can be open side by side in different tabs.
 */
export function PlatformShell() {
  const { admin, signOut, can } = usePlatformAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-slate-900 text-slate-100 print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-5 w-5 text-emerald-400" aria-hidden="true" />
            Platform admin
          </span>
          <nav className="flex flex-1 flex-wrap gap-1" aria-label="Platform">
            {NAV.filter((n) => can(n.permission)).map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/platform'}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-1.5 text-sm hover:bg-white/10',
                    isActive && 'bg-white/15 font-medium',
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <span className="text-xs text-slate-300">{admin?.email}</span>
          <Button
            size="sm"
            variant="ghost"
            className="text-slate-100 hover:bg-white/10 hover:text-white"
            onClick={() => void signOut()}
          >
            <LogOut aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-4 md:p-6">
        <Outlet />
      </main>
      {admin?.mustChangePassword && <ForcedPasswordChange />}
    </div>
  );
}

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z.string().min(8, 'At least 8 characters').max(128),
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    path: ['newPassword'],
    message: 'Must differ from the temporary one',
  });
type Values = z.infer<typeof schema>;

/** A temporary password (from the setup script, or another admin) must be replaced before anything else. */
function ForcedPasswordChange() {
  const { refresh } = usePlatformAuth();
  const change = usePlatformChangePassword();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const onSubmit = form.handleSubmit((values) =>
    change.mutate(values, {
      onSuccess: (response) => {
        refresh(response);
        toast.success('Password changed');
      },
      onError: (error) => {
        for (const f of fieldErrors(error)) {
          if (f.path in values) form.setError(f.path as keyof Values, { message: f.message });
        }
      },
    }),
  );

  return (
    <Dialog
      open
      onClose={() => undefined}
      title="Choose your own password"
      description="You signed in with a temporary password. Replace it to continue."
      size="sm"
      footer={
        <Button onClick={() => void onSubmit()} disabled={change.isPending}>
          Save password
        </Button>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field
          label="Temporary password"
          required
          error={form.formState.errors.currentPassword?.message}
        >
          {(props) => (
            <PasswordInput
              {...props}
              {...form.register('currentPassword')}
              autoComplete="current-password"
            />
          )}
        </Field>
        <Field label="New password" required error={form.formState.errors.newPassword?.message}>
          {(props) => (
            <PasswordInput
              {...props}
              {...form.register('newPassword')}
              autoComplete="new-password"
            />
          )}
        </Field>
      </form>
    </Dialog>
  );
}
