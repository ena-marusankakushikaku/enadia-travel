'use client';

import { Eye, Heart, MapPin, MessageCircle, Sparkles } from 'lucide-react';
import type { Photo, UserProfile } from '@/types/app';
import { formatRelativeDate } from '@/lib/format';
import { MockPhoto } from '@/components/photos/MockPhoto';

type PhotoFeedCardProps = {
  photo: Photo;
  uploader: UserProfile;
  users: UserProfile[];
  onOpenPhoto: (photo: Photo) => void;
  onReact?: (photo: Photo) => void;
  onComment?: (photo: Photo) => void;
};

function getUserName(users: UserProfile[], userId: string): string {
  return users.find((user) => user.id === userId)?.displayName ?? 'Unknown';
}

export function PhotoFeedCard({
  onComment,
  onOpenPhoto,
  onReact,
  photo,
  uploader,
  users
}: PhotoFeedCardProps) {
  const latestComment = photo.comments[0];
  const reactionCount = photo.reactions.filter((reaction) => reaction.reactionType !== 'seen').length;
  const confidenceLabel = photo.confidence !== null ? `${Math.round(photo.confidence * 100)}%` : '未解析';

  return (
    <article className="overflow-hidden rounded-lg border border-enadia-line bg-white shadow-sm">
      <button className="block w-full text-left" onClick={() => onOpenPhoto(photo)} type="button">
        <MockPhoto className="aspect-[4/3] w-full" index={photo.mockImageIndex} title={photo.placeName} />
      </button>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-enadia-ink">{uploader.displayName}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-enadia-muted">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {photo.placeName ?? '場所未設定'}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-1 text-[11px] font-bold text-enadia-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {confidenceLabel}
          </span>
        </div>

        {photo.caption ? <p className="text-sm leading-relaxed text-enadia-ink">{photo.caption}</p> : null}

        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-enadia-muted">
          <button
            className="inline-flex items-center gap-1 rounded-full py-1 transition hover:text-enadia-primary disabled:hover:text-enadia-muted"
            disabled={!onReact}
            onClick={() => onReact?.(photo)}
            type="button"
          >
            <Heart className="h-4 w-4" aria-hidden="true" />
            {reactionCount}
          </button>
          <button
            className="inline-flex items-center gap-1 rounded-full py-1 transition hover:text-enadia-primary disabled:hover:text-enadia-muted"
            disabled={!onComment}
            onClick={() => onComment?.(photo)}
            type="button"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {photo.comments.length}
          </button>
          <span className="inline-flex items-center gap-1">
            <Eye className="h-4 w-4" aria-hidden="true" />
            seen {photo.seenBy.length}
          </span>
          <span className="ml-auto">{formatRelativeDate(photo.ts)}</span>
        </div>

        {latestComment ? (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-enadia-muted">
            <span className="font-bold text-enadia-ink">{getUserName(users, latestComment.userId)}</span>
            <span className="ml-2">{latestComment.text}</span>
          </p>
        ) : null}
      </div>
    </article>
  );
}
