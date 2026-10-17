import { Pencil, PlayCircle, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { fieldErrors } from '@/api/client';
import { PageHeader } from '@/components/common/PageHeader';
import { VideoDialog, VideoThumbnail } from '@/components/common/VideoPlayer';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { MODULES } from '@/config/modules';
import { TUTORIAL_TOPICS, parseYouTubeId, youtubeThumbnail } from '@shared/tutorials';

import { useDeleteTutorial, usePlatformTutorials, useSaveTutorial } from '../hooks';

import type { TutorialBody } from '../hooks';
import type { TutorialPayload, TutorialTopic } from '@shared/tutorials';

/** Where a video shows, in words. Module topics take the module's own name. */
const TOPIC_LABEL: Record<TutorialTopic, string> = Object.fromEntries(
  TUTORIAL_TOPICS.map((t) => [
    t,
    t === 'overview'
      ? 'Landing page demo'
      : t === 'getting-started'
        ? 'Getting started'
        : (MODULES.find((m) => m.key === t)?.label ?? t),
  ]),
) as Record<TutorialTopic, string>;

const TOPIC_HINT: Partial<Record<TutorialTopic, string>> = {
  overview: 'Shown to visitors on the public landing page. The first published one is used.',
  'getting-started': 'Shown first on the Tutorials page and on the dashboard checklist.',
};

/**
 * `/platform/tutorials` — the training videos every business sees (`platform:content`). Paste a
 * YouTube link; the video shows on the Tutorials page, as "Watch how" on its module, and — for the
 * landing page demo topic — on the public website.
 */
export function TutorialsPage() {
  const { data, isLoading } = usePlatformTutorials();
  const remove = useDeleteTutorial();
  const [editing, setEditing] = useState<TutorialPayload | 'new' | null>(null);
  const [playing, setPlaying] = useState<TutorialPayload | null>(null);

  const groups = TUTORIAL_TOPICS.map((topic) => ({
    topic,
    videos: (data ?? []).filter((t) => t.topic === topic),
  })).filter((g) => g.videos.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tutorials"
        description="Training videos for customers — on their Tutorials page, beside each module, and the demo on the landing page"
        icon={PlayCircle}
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus aria-hidden="true" />
            Add video
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : groups.length === 0 ? (
        <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">
          No videos yet. Upload one to YouTube, then “Add video” and paste its link.
        </p>
      ) : (
        groups.map(({ topic, videos }) => (
          <section key={topic} className="space-y-3">
            <h2 className="font-semibold">{TOPIC_LABEL[topic]}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {videos.map((t) => (
                <article key={t.id} className="space-y-2 rounded-lg border p-3">
                  <VideoThumbnail youtubeId={t.youtubeId} title={t.titleEn} onPlay={() => setPlaying(t)} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium" lang="bn">{t.titleBn}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.titleEn}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Order {t.sortOrder} · {t.isPublished ? 'Published' : 'Hidden'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => setEditing(t)}>
                      <Pencil aria-hidden="true" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      disabled={remove.isPending}
                      onClick={() => {
                        if (window.confirm(`Delete “${t.titleEn}”? Customers will no longer see it.`)) {
                          remove.mutate(t.id);
                        }
                      }}
                    >
                      <Trash2 aria-hidden="true" />
                      Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      )}

      {editing && (
        <TutorialEditor
          tutorial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
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

function TutorialEditor({
  tutorial,
  onClose,
}: {
  tutorial: TutorialPayload | null;
  onClose: () => void;
}) {
  const save = useSaveTutorial();
  const [form, setForm] = useState<TutorialBody>({
    topic: tutorial?.topic ?? 'getting-started',
    titleBn: tutorial?.titleBn ?? '',
    titleEn: tutorial?.titleEn ?? '',
    descriptionBn: tutorial?.descriptionBn ?? null,
    descriptionEn: tutorial?.descriptionEn ?? null,
    youtubeId: tutorial ? `https://youtu.be/${tutorial.youtubeId}` : '',
    sortOrder: tutorial?.sortOrder ?? 0,
    isPublished: tutorial?.isPublished ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof TutorialBody>(key: K, value: TutorialBody[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const videoId = parseYouTubeId(form.youtubeId);
  const linkError =
    form.youtubeId.trim() && !videoId ? 'That is not a YouTube video link' : errors.youtubeId;

  const submit = () =>
    save.mutate(
      {
        id: tutorial?.id ?? null,
        body: {
          ...form,
          descriptionBn: form.descriptionBn?.trim() || null,
          descriptionEn: form.descriptionEn?.trim() || null,
        },
      },
      {
        onSuccess: onClose,
        onError: (error) =>
          setErrors(Object.fromEntries(fieldErrors(error).map((f) => [f.path, f.message]))),
      },
    );

  return (
    <Dialog
      open
      onClose={onClose}
      title={tutorial ? 'Edit video' : 'Add video'}
      description="Upload the video to YouTube first, then paste its link here."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!videoId || !form.titleBn.trim() || !form.titleEn.trim() || save.isPending}
            onClick={submit}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="YouTube link" required error={linkError} className="sm:col-span-2">
          {(p) => (
            <Input
              {...p}
              value={form.youtubeId}
              onChange={(e) => set('youtubeId', e.target.value)}
              placeholder="https://youtu.be/…"
              autoFocus
            />
          )}
        </Field>
        {videoId && (
          <img
            src={youtubeThumbnail(videoId)}
            alt="Video thumbnail"
            className="aspect-video w-full rounded-md object-cover sm:col-span-2 sm:w-1/2"
          />
        )}
        <Field label="Where it shows" required error={errors.topic} hint={TOPIC_HINT[form.topic]}>
          {(p) => (
            <Select {...p} value={form.topic} onChange={(e) => set('topic', e.target.value as TutorialTopic)}>
              {TUTORIAL_TOPICS.map((t) => (
                <option key={t} value={t}>
                  {TOPIC_LABEL[t]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Order" hint="Lower comes first within its group" error={errors.sortOrder}>
          {(p) => (
            <Input
              {...p}
              type="number"
              min={0}
              max={1000}
              value={form.sortOrder}
              onChange={(e) => set('sortOrder', Number(e.target.value) || 0)}
            />
          )}
        </Field>
        <Field label="Title (Bangla)" required error={errors.titleBn}>
          {(p) => <Input {...p} lang="bn" value={form.titleBn} onChange={(e) => set('titleBn', e.target.value)} />}
        </Field>
        <Field label="Title (English)" required error={errors.titleEn}>
          {(p) => <Input {...p} value={form.titleEn} onChange={(e) => set('titleEn', e.target.value)} />}
        </Field>
        <Field label="Description (Bangla)" error={errors.descriptionBn}>
          {(p) => (
            <Textarea
              {...p}
              lang="bn"
              rows={2}
              maxLength={500}
              value={form.descriptionBn ?? ''}
              onChange={(e) => set('descriptionBn', e.target.value)}
            />
          )}
        </Field>
        <Field label="Description (English)" error={errors.descriptionEn}>
          {(p) => (
            <Textarea
              {...p}
              rows={2}
              maxLength={500}
              value={form.descriptionEn ?? ''}
              onChange={(e) => set('descriptionEn', e.target.value)}
            />
          )}
        </Field>
        <label className="flex items-center gap-3 text-sm sm:col-span-2">
          <Switch checked={form.isPublished} onCheckedChange={(v) => set('isPublished', v)} />
          Published — customers can see it
        </label>
      </div>
    </Dialog>
  );
}
