import { getData } from '@/api/client';

import type { TutorialPayload } from '@shared/tutorials';

/** The published training videos. Silent: they decorate pages, nobody asked for them. */
export function fetchTutorials(): Promise<TutorialPayload[]> {
  return getData<TutorialPayload[]>('/tutorials', undefined, { silent: true });
}
