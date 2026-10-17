import { PlayCircle } from 'lucide-react';
import { useState } from 'react';

import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { VideoDialog, VideoThumbnail } from '@/components/common/VideoPlayer';
import { Skeleton } from '@/components/ui/skeleton';
import { MODULES } from '@/config/modules';
import { useCan } from '@/hooks/data/useAuth';
import { usePlanFeatures } from '@/hooks/data/useOrg';
import { useTutorials } from '@/hooks/data/useTutorials';

import type { TutorialPayload, TutorialTopic } from '@shared/tutorials';

/**
 * `/tutorials` — the training videos, grouped: "Getting started" first, then one group per module,
 * in sidebar order. A module this user's role or plan does not open has no group, exactly as it has
 * no menu entry. Videos are added on the platform (Platform → Tutorials).
 */
export function TutorialsPage() {
  const { data, isLoading } = useTutorials();
  const can = useCan();
  const inPlan = usePlanFeatures();
  const [playing, setPlaying] = useState<TutorialPayload | null>(null);

  const groups: { key: TutorialTopic; label: string }[] = [
    { key: 'getting-started', label: 'Getting started' },
    ...MODULES.filter(
      (m) => m.key !== 'dashboard' && m.key !== 'tutorials' && can(m.permission) && inPlan(m.feature),
    ).map((m) => ({ key: m.key as TutorialTopic, label: m.label })),
  ];
  const filled = groups
    .map((g) => ({ ...g, videos: (data ?? []).filter((t) => t.topic === g.key) }))
    .filter((g) => g.videos.length > 0);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Tutorials"
        description="Short videos on how to use each part of the system"
        icon={PlayCircle}
      />

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="aspect-video" />
          ))}
        </div>
      ) : filled.length === 0 ? (
        <EmptyState
          icon={PlayCircle}
          title="No videos yet"
          description="Training videos will appear here as they are published."
        />
      ) : (
        filled.map((g) => (
          <section key={g.key} id={g.key} className="scroll-mt-20 space-y-3">
            <h2 className="text-lg font-semibold">{g.label}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {g.videos.map((t) => (
                <article key={t.id} className="space-y-2">
                  <VideoThumbnail youtubeId={t.youtubeId} title={t.titleEn} onPlay={() => setPlaying(t)} />
                  <div>
                    <h3 className="text-sm font-medium" lang="bn">{t.titleBn}</h3>
                    <p className="text-xs text-muted-foreground">{t.titleEn}</p>
                    {(t.descriptionBn || t.descriptionEn) && (
                      <p className="mt-1 text-xs text-muted-foreground" lang={t.descriptionBn ? 'bn' : 'en'}>
                        {t.descriptionBn ?? t.descriptionEn}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      )}

      {playing && (
        <VideoDialog
          youtubeId={playing.youtubeId}
          title={playing.titleBn}
          description={playing.titleEn}
          onClose={() => setPlaying(null)}
        />
      )}
    </div>
  );
}
