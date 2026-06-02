'use client';

import { Heart, MapPin, MessageCircle, SmilePlus, X } from 'lucide-react';
import type { Photo, UserProfile } from '@/types/app';
import { formatRelativeDate } from '@/lib/format';
import { MockPhoto } from '@/components/photos/MockPhoto';

type PhotoViewerProps = {
  photo: Photo | null;
  users: UserProfile[];
  open: boolean;
  onClose: () => void;
};

function getUserName(users: UserProfile[], userId: string): string {
  return users.find((user) => user.id === userId)?.displayName ?? 'Unknown';
}

export function PhotoViewer({ onClose, open, photo, users }: PhotoViewerProps) {
  if (!open || !photo) {
    return null;
  }

  const meaningfulReactions = photo.reactions.filter((reaction) => reaction.reactionType !== 'seen');
  const seenCount = photo.seenBy.length;

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[480px] flex-col bg-slate-950 text-white">
      <div className="absolute right-3 top-[max(12px,env(safe-area-inset-top))] z-10">
        <button
          aria-label="写真を閉じる"
          className="grid h-10 w-10 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/55"
          onClick={onClose}
          type="button"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <MockPhoto className="min-h-0 flex-1" index={photo.mockImageIndex} title={photo.placeName} />
      <section className="safe-bottom border-t border-white/10 bg-slate-950/96 p-5">
        <div className="mb-3 flex items-center gap-2 text-sm text-white/72">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          <span>{photo.placeName ?? '場所未設定'}</span>
          <span className="ml-auto">{formatRelativeDate(photo.ts)}</span>
        </div>
        {photo.caption ? <p className="text-base font-semibold leading-relaxed">{photo.caption}</p> : null}
        <div className="mt-4 flex items-center gap-4 text-sm text-white/78">
          <span className="inline-flex items-center gap-1.5">
            <Heart className="h-4 w-4" aria-hidden="true" />
            {meaningfulReactions.length}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {photo.comments.length}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <SmilePlus className="h-4 w-4" aria-hidden="true" />
            seen {seenCount}
          </span>
        </div>
        {photo.comments.length > 0 ? (
          <div className="mt-4 space-y-2">
            {photo.comments.slice(0, 2).map((comment) => (
              <p className="rounded-lg bg-white/8 px-3 py-2 text-sm text-white/86" key={comment.id}>
                <span className="font-bold text-white">{getUserName(users, comment.userId)}</span>
                <span className="ml-2">{comment.text}</span>
              </p>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
