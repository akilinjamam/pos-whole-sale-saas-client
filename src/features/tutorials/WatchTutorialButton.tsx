import { PlayCircle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { VideoDialog } from '@/components/common/VideoPlayer';
import { Button, buttonVariants } from '@/components/ui/button';
import { useTopicTutorials } from '@/hooks/data/useTutorials';

import type { TutorialTopic } from '@shared/tutorials';

/**
 * "Watch how" on a module's page: plays the module's video when there is one, opens its group on the
 * Tutorials page when there are several, and draws nothing when there are none.
 */
export function WatchTutorialButton({
  topic,
  label = 'Watch how',
}: {
  topic: TutorialTopic | string;
  label?: string;
}) {
  const videos = useTopicTutorials(topic);
  const [open, setOpen] = useState(false);

  if (videos.length === 0) return null;
  if (videos.length > 1) {
    return (
      <Link to={`/tutorials#${topic}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
        <PlayCircle aria-hidden="true" />
        {label} ({videos.length})
      </Link>
    );
  }

  const video = videos[0]!;
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <PlayCircle aria-hidden="true" />
        {label}
      </Button>
      {open && (
        <VideoDialog
          youtubeId={video.youtubeId}
          title={video.titleBn}
          description={video.titleEn}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
