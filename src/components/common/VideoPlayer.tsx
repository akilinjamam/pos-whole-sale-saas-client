import { Play } from 'lucide-react';

import { Dialog } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { youtubeEmbed, youtubeThumbnail } from '@shared/tutorials';

/**
 * Training and demo videos, "lite": a YouTube thumbnail with a play button, and the real player only
 * once someone presses it (in a dialog). Nothing is loaded from YouTube's player until then, which
 * keeps pages fast on a slow line — and the player itself is the privacy-enhanced
 * youtube-nocookie.com one.
 */

export function VideoThumbnail({
  youtubeId,
  title,
  onPlay,
  className,
}: {
  youtubeId: string;
  /** What the button says to a screen reader: "Play: <title>". */
  title: string;
  onPlay: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={`Play: ${title}`}
      className={cn(
        'group relative block aspect-video w-full overflow-hidden rounded-md bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <img
        src={youtubeThumbnail(youtubeId)}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-black/20">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white shadow-lg transition-transform group-hover:scale-110">
          <Play className="ml-0.5 h-6 w-6 fill-current" aria-hidden="true" />
        </span>
      </span>
    </button>
  );
}

/** The player, in a dialog. Closing it unmounts the iframe, which stops the video. */
export function VideoDialog({
  youtubeId,
  title,
  description,
  onClose,
}: {
  youtubeId: string;
  title: string;
  description?: string;
  onClose: () => void;
}) {
  return (
    <Dialog open onClose={onClose} title={title} description={description} size="xl">
      <div className="aspect-video w-full overflow-hidden rounded-md bg-black">
        <iframe
          src={youtubeEmbed(youtubeId)}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </Dialog>
  );
}
