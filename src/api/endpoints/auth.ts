import { getData, postData } from '@/api/client';

import type { AuthUser, LoginResponse, TokenPair, VerifyEmailResponse } from '@shared/types';

/**
 * Every call the auth flow makes, typed from the shared contract.
 *
 * Endpoint functions stay this thin on purpose — they are the only place a URL string is
 * written, so a route rename is one edit here rather than a search through components.
 */

export interface LoginBody {
  email: string;
  password: string;
}

export function login(body: LoginBody): Promise<LoginResponse> {
  return postData<LoginResponse>('/auth/login', body);
}

/** Who the caller is, re-derived server-side. The source of truth after a reload. */
export function fetchMe(): Promise<AuthUser> {
  return getData<AuthUser>('/auth/me');
}

/**
 * Bumps `tokenVersion` server-side, so this signs the user out on every device — not just
 * this browser. On a shared counter terminal that is the point.
 */
export function logout(): Promise<void> {
  return postData<void>('/auth/logout');
}

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

/** Returns a fresh pair, because changing the password invalidates the caller's own tokens. */
export function changePassword(body: ChangePasswordBody): Promise<TokenPair> {
  return postData<TokenPair>('/auth/password', body);
}

// ─── Self-service account flows (SaaS phase 3) ──────────────────────────────────────────

export interface SignupBody {
  businessName: string;
  ownerName: string;
  email: string;
  phone?: string | null;
  password: string;
}

/** Creates the business and its owner, and signs the owner in — the same answer as `login`. */
export function signup(body: SignupBody): Promise<LoginResponse> {
  return postData<LoginResponse>('/auth/signup', body);
}

export function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  return postData<VerifyEmailResponse>('/auth/verify-email', { token });
}

/** `sent: false` when the address is already verified. */
export function resendVerification(): Promise<{ sent: boolean }> {
  return postData<{ sent: boolean }>('/auth/resend-verification');
}

/** Succeeds whether or not the address has an account — the server does not say. */
export function forgotPassword(email: string): Promise<void> {
  return postData<void>('/auth/forgot-password', { email });
}

export function resetPassword(body: { token: string; password: string }): Promise<void> {
  return postData<void>('/auth/reset-password', body);
}
