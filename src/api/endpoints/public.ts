import { getData } from '@/api/client';

import type { PublicSitePayload } from '@shared/types';

/** The signed-out website's plans, numbers and contact details (SaaS phase 8). No token needed. */
export function fetchPublicSite(): Promise<PublicSitePayload> {
  return getData<PublicSitePayload>('/public/site', undefined, { silent: true });
}
