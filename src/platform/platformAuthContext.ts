import { createContext, useContext } from 'react';

import type {
  PlatformAdminPayload,
  PlatformLoginResponse,
  PlatformPermission,
} from '@shared/platform';

/** The platform admin's session — provided by `PlatformAuthProvider` (PlatformAuth.tsx). */
export interface PlatformAuth {
  admin: PlatformAdminPayload | null;
  status: 'loading' | 'signedIn' | 'signedOut';
  signIn: (response: PlatformLoginResponse) => void;
  signOut: () => Promise<void>;
  /** Replace the admin after a profile change (e.g. a password change clears mustChangePassword). */
  refresh: (response: PlatformLoginResponse) => void;
  can: (permission: PlatformPermission) => boolean;
}

export const PlatformAuthContext = createContext<PlatformAuth | null>(null);

export function usePlatformAuth(): PlatformAuth {
  const value = useContext(PlatformAuthContext);
  if (!value) throw new Error('usePlatformAuth outside PlatformAuthProvider');
  return value;
}
