import { useQuery } from '@tanstack/react-query';

import { fetchTutorials } from '@/api/endpoints/tutorials';

import type { TutorialTopic } from '@shared/tutorials';

/** The published training videos. They change rarely — a new video shows up within 10 minutes. */
export function useTutorials() {
  return useQuery({
    queryKey: ['tutorials'],
    queryFn: fetchTutorials,
    staleTime: 10 * 60_000,
  });
}

/** The videos for one module (topic), in order. Empty while loading, or when there are none. */
export function useTopicTutorials(topic: TutorialTopic | string | undefined) {
  const { data } = useTutorials();
  return (data ?? []).filter((t) => t.topic === topic);
}
