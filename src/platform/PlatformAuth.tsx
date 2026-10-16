import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { pget, platformTokenStore, ppost, registerPlatformSignOut } from './api';
import { PlatformAuthContext, usePlatformAuth } from './platformAuthContext';

import type { PlatformAuth } from './platformAuthContext';

import type { PlatformAdminPayload } from '@shared/platform';
import type { ReactNode } from 'react';

/**
 * The platform admin's session (SaaS phase 5) — React state over `sessionStorage`, deliberately not
 * the tenant Redux auth slice. It is a different identity, for a different API.
 */

export function PlatformAuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [admin, setAdmin] = useState<PlatformAdminPayload | null>(null);
  const [status, setStatus] = useState<PlatformAuth['status']>(() =>
    platformTokenStore.get() ? 'loading' : 'signedOut',
  );

  const dropSession = useCallback(() => {
    platformTokenStore.set(null);
    setAdmin(null);
    setStatus('signedOut');
    queryClient.removeQueries({ queryKey: ['platform'] });
  }, [queryClient]);

  useEffect(() => registerPlatformSignOut(dropSession), [dropSession]);

  // A reload with a stored token: confirm it is still good before drawing anything.
  useEffect(() => {
    if (status !== 'loading') return;
    pget<PlatformAdminPayload>('/auth/me')
      .then((me) => {
        setAdmin(me);
        setStatus('signedIn');
      })
      .catch(() => dropSession());
  }, [status, dropSession]);

  const value = useMemo<PlatformAuth>(
    () => ({
      admin,
      status,
      signIn: (response) => {
        platformTokenStore.set(response.accessToken);
        setAdmin(response.admin);
        setStatus('signedIn');
      },
      refresh: (response) => {
        platformTokenStore.set(response.accessToken);
        setAdmin(response.admin);
      },
      signOut: async () => {
        try {
          await ppost('/auth/logout');
        } finally {
          dropSession();
        }
      },
      can: (permission) => Boolean(admin?.permissions.includes(permission)),
    }),
    [admin, status, dropSession],
  );

  return <PlatformAuthContext.Provider value={value}>{children}</PlatformAuthContext.Provider>;
}

/** The guard on every platform screen but the login. */
export function RequirePlatformAuth() {
  const { status } = usePlatformAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }
  if (status === 'signedOut') {
    return <Navigate to="/platform/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
