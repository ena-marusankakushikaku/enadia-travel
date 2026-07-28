'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  Plus,
  Send,
  Star,
  Tag,
  Trash2,
  X
} from 'lucide-react';
import { clsx } from 'clsx';
import { MockPhoto } from '@/components/photos/MockPhoto';
import { Modal } from '@/components/common/Modal';
import { getPrefectureName } from '@/constants/japan';
import { persistThemeEntry } from '@/lib/api/themeEntriesClient';
import type { ConquestEntry, ConquestProject, Photo, UserProfile } from '@/types/app';

type PhotoDetailViewerProps = {
  photos: Photo[];
  photoId: string | null;
  onClose: () => void;
  users: UserProfile[];
  currentUserId: string;
  canEdit: boolean;
  projects: ConquestProject[];
  themeEntries: ConquestEntry[];
  tripId: string;
  onChanged: () => void;
  onEditLocation: (photo: Photo) => void;
};

function getUserName(users: UserProfile[], userId: string): string {
  return users.find((user) => user.id === userId)?.displayName ?? 'メンバー';
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsed);
}

export function PhotoDetailViewer({
  canEdit,
  currentUserId,
  onChanged,
  onClose,
  onEditLocation,
  photoId,
  photos,
  projects,
  themeEntries,
  tripId,
  users
}: PhotoDetailViewerProps) {
  // サーバーから届いた内容を土台に、操作直後の見た目だけ先に更新する
  const [localPhotos, setLocalPhotos] = useState(photos);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const [savingThemeId, setSavingThemeId] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setLocalPhotos(photos);
  }, [photos]);

  // 表示中の写真は内部で持ち、前後移動はここだけで完結させる
  const [activeId, setActiveId] = useState<string | null>(photoId);
  useEffect(() => {
    setActiveId(photoId);
  }, [photoId]);

  const activeIndex = localPhotos.findIndex((item) => item.id === activeId);
  const activePhoto = activeIndex >= 0 ? localPhotos[activeIndex] : null;

  const goTo = useCallback(
    (nextIndex: number) => {
      const target = localPhotos[nextIndex];
      if (!target) {
        return;
      }
      setActiveId(target.id);
      setCommentText('');
      setError(null);
    },
    [localPhotos]
  );

  const goPrev = useCallback(() => {
    if (activeIndex > 0) {
      goTo(activeIndex - 1);
    }
  }, [activeIndex, goTo]);

  const goNext = useCallback(() => {
    if (activeIndex >= 0 && activeIndex < localPhotos.length - 1) {
      goTo(activeIndex + 1);
    }
  }, [activeIndex, goTo, localPhotos.length]);

  useEffect(() => {
    if (activeIndex < 0) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowLeft') {
        goPrev();
      } else if (event.key === 'ArrowRight') {
        goNext();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [activeIndex, goNext, goPrev, onClose]);

  const photoTags = useMemo(
    () => themeEntries.filter((entry) => entry.photoId === activePhoto?.id),
    [activePhoto?.id, themeEntries]
  );

  const taggedProjectIds = useMemo(() => new Set(photoTags.map((tag) => tag.projectId)), [photoTags]);

  if (!activePhoto) {
    return null;
  }

  const likes = activePhoto.reactions.filter((reaction) => reaction.reactionType === 'like');
  const isLiked = likes.some((reaction) => reaction.userId === currentUserId);
  const isFavorite = activePhoto.reactions.some(
    (reaction) => reaction.reactionType === 'heart' && reaction.userId === currentUserId
  );

  function updateLocalReaction(targetId: string, reactionType: 'like' | 'heart', active: boolean) {
    setLocalPhotos((current) =>
      current.map((item) => {
        if (item.id !== targetId) {
          return item;
        }

        const withoutMine = item.reactions.filter(
          (reaction) => !(reaction.reactionType === reactionType && reaction.userId === currentUserId)
        );

        return {
          ...item,
          reactions: active
            ? [
                ...withoutMine,
                {
                  id: `local-${reactionType}-${targetId}`,
                  photoId: targetId,
                  userId: currentUserId,
                  reactionType,
                  createdAt: new Date().toISOString()
                }
              ]
            : withoutMine
        };
      })
    );
  }

  async function toggleReaction(reactionType: 'like' | 'heart') {
    if (!activePhoto) {
      return;
    }

    const target = activePhoto.id;
    const nextActive = reactionType === 'like' ? !isLiked : !isFavorite;

    updateLocalReaction(target, reactionType, nextActive);
    setError(null);

    try {
      const response = await fetch('/api/photo-reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: target, reactionType })
      });

      if (!response.ok) {
        updateLocalReaction(target, reactionType, !nextActive);
        setError(reactionType === 'like' ? 'いいねに失敗しました。' : 'お気に入りに失敗しました。');
        return;
      }

      onChanged();
    } catch {
      updateLocalReaction(target, reactionType, !nextActive);
      setError('通信に失敗しました。');
    }
  }

  async function submitComment() {
    const text = commentText.trim();
    if (!activePhoto || text.length === 0 || sending) {
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await fetch('/api/photo-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: activePhoto.id, text })
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? 'コメントの投稿に失敗しました。');
        return;
      }

      const targetId = activePhoto.id;
      setLocalPhotos((current) =>
        current.map((item) =>
          item.id === targetId
            ? {
                ...item,
                comments: [
                  ...item.comments,
                  {
                    id: `local-comment-${Date.now()}`,
                    photoId: targetId,
                    userId: currentUserId,
                    text,
                    createdAt: new Date().toISOString()
                  }
                ]
              }
            : item
        )
      );
      setCommentText('');
      onChanged();
    } catch {
      setError('通信に失敗しました。');
    } finally {
      setSending(false);
    }
  }

  async function deleteComment(commentId: string) {
    if (!activePhoto || commentId.startsWith('local-')) {
      return;
    }

    const targetId = activePhoto.id;
    setLocalPhotos((current) =>
      current.map((item) =>
        item.id === targetId
          ? { ...item, comments: item.comments.filter((comment) => comment.id !== commentId) }
          : item
      )
    );

    try {
      const response = await fetch(`/api/photo-comments/${commentId}`, { method: 'DELETE' });
      if (!response.ok) {
        setError('コメントの削除に失敗しました。');
      }
      onChanged();
    } catch {
      setError('通信に失敗しました。');
    }
  }

  async function addThemeTag(project: ConquestProject) {
    if (!activePhoto || savingThemeId) {
      return;
    }

    setSavingThemeId(project.id);
    setError(null);

    const visitedAt = activePhoto.capturedAt ?? activePhoto.ts;

    const persisted = await persistThemeEntry({
      id: `draft-${project.id}-${activePhoto.id}`,
      projectId: project.id,
      userId: currentUserId,
      tripId,
      photoId: activePhoto.id,
      prefectureId: activePhoto.prefectureId ?? 0,
      title: activePhoto.placeName ?? project.name,
      memo: null,
      rating: null,
      visitedAt,
      placeName: activePhoto.placeName,
      lat: activePhoto.lat,
      lng: activePhoto.lng,
      source: 'photo_suggestion',
      metadata: { fromPhoto: true }
    });

    setSavingThemeId(null);

    if (!persisted) {
      setError('テーマの追加に失敗しました。写真に都道府県が設定されているか確認してください。');
      return;
    }

    setIsThemePickerOpen(false);
    onChanged();
  }

  async function removeThemeTag(entryId: string) {
    setError(null);

    try {
      const response = await fetch(`/api/conquest-entries/${entryId}`, { method: 'DELETE' });
      if (!response.ok) {
        setError('テーマの解除に失敗しました。');
        return;
      }
      onChanged();
    } catch {
      setError('通信に失敗しました。');
    }
  }

  const hasPrefecture = activePhoto.prefectureId !== null;

  return (
    <>
      <div
        aria-modal="true"
        className="fixed inset-0 z-40 mx-auto flex max-w-[480px] flex-col bg-slate-950 text-white"
        role="dialog"
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          const start = touchStartX.current;
          const end = event.changedTouches[0]?.clientX ?? null;
          touchStartX.current = null;
          if (start === null || end === null) {
            return;
          }
          const distance = end - start;
          if (distance > 60) {
            goPrev();
          } else if (distance < -60) {
            goNext();
          }
        }}
      >
        <div className="flex items-center justify-between px-3 pb-2 pt-[max(10px,env(safe-area-inset-top))]">
          <button
            aria-label="閉じる"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="text-xs font-semibold text-white/70">
            {activeIndex + 1} / {localPhotos.length}
          </span>
          <div className="h-10 w-10" />
        </div>

        <div className="relative min-h-0 flex-1">
          <MockPhoto className="h-full w-full" index={activePhoto.mockImageIndex} src={activePhoto.imageUrl} title={null} />

          {activeIndex > 0 ? (
            <button
              aria-label="前の写真"
              className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/35 backdrop-blur transition hover:bg-black/55"
              onClick={goPrev}
              type="button"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </button>
          ) : null}

          {activeIndex < localPhotos.length - 1 ? (
            <button
              aria-label="次の写真"
              className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/35 backdrop-blur transition hover:bg-black/55"
              onClick={goNext}
              type="button"
            >
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <section className="safe-bottom max-h-[52dvh] overflow-y-auto border-t border-white/10 bg-slate-950 px-4 pb-4 pt-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <MapPin className="h-4 w-4 shrink-0 text-white/60" aria-hidden="true" />
                <span className="truncate">{activePhoto.placeName ?? '場所未設定'}</span>
              </p>
              <p className="mt-1 text-xs text-white/55">
                {getPrefectureName(activePhoto.prefectureId)} ・ {formatDateTime(activePhoto.capturedAt ?? activePhoto.ts)}
              </p>
            </div>
            {canEdit ? (
              <button
                className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold transition hover:bg-white/20"
                onClick={() => onEditLocation(activePhoto)}
                type="button"
              >
                場所を{activePhoto.placeName ? '修正' : '設定'}
              </button>
            ) : null}
          </div>

          {activePhoto.caption ? (
            <p className="mt-3 text-sm leading-relaxed text-white/90">{activePhoto.caption}</p>
          ) : null}

          <div className="mt-3 flex items-center gap-2">
            <button
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold transition',
                isLiked ? 'bg-rose-500 text-white' : 'bg-white/10 text-white/80 hover:bg-white/20'
              )}
              onClick={() => toggleReaction('like')}
              type="button"
            >
              <Heart className={clsx('h-4 w-4', isLiked && 'fill-white')} aria-hidden="true" />
              いいね {likes.length > 0 ? likes.length : ''}
            </button>

            <button
              aria-label={isFavorite ? 'お気に入りから外す' : 'お気に入りに追加'}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold transition',
                isFavorite ? 'bg-amber-400 text-slate-900' : 'bg-white/10 text-white/80 hover:bg-white/20'
              )}
              onClick={() => toggleReaction('heart')}
              type="button"
            >
              <Star className={clsx('h-4 w-4', isFavorite && 'fill-slate-900')} aria-hidden="true" />
              お気に入り
            </button>
          </div>

          {likes.length > 0 ? (
            <p className="mt-2 text-xs text-white/55">
              {likes
                .slice(0, 3)
                .map((reaction) => getUserName(users, reaction.userId))
                .join('、')}
              {likes.length > 3 ? ` ほか${likes.length - 3}人` : ''} がいいねしました
            </p>
          ) : null}

          <div className="mt-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-white/70">
              <Tag className="h-3.5 w-3.5" aria-hidden="true" />
              テーマ
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {photoTags.map((tag) => {
                const project = projects.find((item) => item.id === tag.projectId);
                return (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-white/12 py-1 pl-2.5 pr-1 text-xs font-bold"
                    key={tag.id}
                  >
                    {project?.emoji ?? '🎯'} {project?.name ?? 'テーマ'}
                    {canEdit ? (
                      <button
                        aria-label="このテーマを外す"
                        className="grid h-5 w-5 place-items-center rounded-full text-white/60 transition hover:bg-white/20 hover:text-white"
                        onClick={() => removeThemeTag(tag.id)}
                        type="button"
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    ) : null}
                  </span>
                );
              })}

              {canEdit ? (
                <button
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-white/30 px-2.5 py-1 text-xs font-bold text-white/70 transition hover:bg-white/10"
                  onClick={() => setIsThemePickerOpen(true)}
                  type="button"
                >
                  <Plus className="h-3 w-3" aria-hidden="true" />
                  テーマを付ける
                </button>
              ) : null}

              {photoTags.length === 0 && !canEdit ? (
                <span className="text-xs text-white/45">テーマは付いていません</span>
              ) : null}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs font-bold text-white/70">コメント {activePhoto.comments.length}件</p>
            <div className="mt-2 space-y-2">
              {activePhoto.comments.map((comment) => (
                <div className="flex items-start gap-2 rounded-lg bg-white/8 px-3 py-2" key={comment.id}>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white/90">{getUserName(users, comment.userId)}</p>
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-white/85">{comment.text}</p>
                  </div>
                  {comment.userId === currentUserId ? (
                    <button
                      aria-label="コメントを削除"
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white/45 transition hover:bg-white/15 hover:text-white"
                      onClick={() => deleteComment(comment.id)}
                      type="button"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              ))}
              {activePhoto.comments.length === 0 ? (
                <p className="text-xs text-white/45">まだコメントはありません。</p>
              ) : null}
            </div>

            <div className="mt-3 flex items-end gap-2">
              <textarea
                className="min-h-11 flex-1 resize-none rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="コメントを書く"
                rows={1}
                value={commentText}
              />
              <button
                aria-label="コメントを送信"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-enadia-primary transition hover:bg-enadia-primaryDark disabled:opacity-40"
                disabled={commentText.trim().length === 0 || sending}
                onClick={submitComment}
                type="button"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
        </section>
      </div>

      <Modal
        onClose={() => setIsThemePickerOpen(false)}
        open={isThemePickerOpen}
        testId="photo-theme-picker"
        title="テーマを付ける"
      >
        <div className="space-y-3">
          {!hasPrefecture ? (
            <p className="rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
              この写真には都道府県が設定されていません。先に「場所を設定」から都道府県を選んでください。
            </p>
          ) : null}

          {projects.length === 0 ? (
            <p className="rounded-lg border border-dashed border-enadia-line p-4 text-center text-sm text-enadia-muted">
              制覇テーマがまだありません。「制覇」タブでテーマを作成してください。
            </p>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => {
                const alreadyTagged = taggedProjectIds.has(project.id);

                return (
                  <button
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition',
                      alreadyTagged || !hasPrefecture
                        ? 'border-enadia-line bg-slate-50 opacity-50'
                        : 'border-enadia-line bg-white hover:border-enadia-primary'
                    )}
                    disabled={alreadyTagged || !hasPrefecture || savingThemeId !== null}
                    key={project.id}
                    onClick={() => addThemeTag(project)}
                    type="button"
                  >
                    <span className="text-2xl">{project.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-enadia-ink">{project.name}</span>
                      <span className="block text-xs text-enadia-muted">
                        {alreadyTagged ? 'この写真に設定済み' : `${new Set(project.entries.map((entry) => entry.prefectureId)).size} / 47 県`}
                      </span>
                    </span>
                    {savingThemeId === project.id ? (
                      <span className="text-xs font-bold text-enadia-muted">保存中…</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
