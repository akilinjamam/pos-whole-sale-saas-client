import { useQuery } from '@tanstack/react-query';

import { fetchPublicSite } from '@/api/endpoints/public';

/** Plans and operator details for the public pages. Changes rarely; the server caches it 5 min. */
export function usePublicSite() {
  return useQuery({
    queryKey: ['public', 'site'],
    queryFn: fetchPublicSite,
    staleTime: 5 * 60_000,
  });
}
