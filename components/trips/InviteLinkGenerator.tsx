'use client';

import { useState } from 'react';
import { Check, Copy, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { mapTripInviteRow } from '@/lib/api/tripInvites';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { TripRole } from '@/types/app';

type InviteLinkGeneratorProps = {
  tripId: string;
  currentUserId: string;
};

type InviteLinkRole = Extract<TripRole, 'editor' | 'viewer'>;

const INVITE_EXPIRES_IN_DAYS = 7;

export function InviteLinkGenerator({ currentUserId, tripId }: InviteLinkGeneratorProps) {
  const [role, setRole] = useState<InviteLinkRole>('editor');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function issueInviteLink() {
    setLoading(true);
    setError(null);
    setCopied(false);

    const expiresAt = new Date(Date.now() + INVITE_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data, error: insertError } = await createSupabaseBrowserClient()
      .from('trip_invites')
      .insert({ trip_id: tripId, created_by: currentUserId, role, expires_at: expiresAt })
      .select()
      .single();

    setLoading(false);
    if (insertError || !data) {
      setError('招待リンクの発行に失敗しました。');
      return;
    }

    const invite = mapTripInviteRow(data);
    setInviteUrl(`${window.location.origin}/invite/${invite.token}`);
  }

  async function copyUrl() {
    if (!inviteUrl) {
      return;
    }
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border border-enadia-line bg-white p-4">
      <h2 className="text-base font-bold text-enadia-ink">招待リンク</h2>
      <p className="mt-1 text-xs text-enadia-muted">
        リンクを知っている人は誰でも参加できます（発行から{INVITE_EXPIRES_IN_DAYS}日間有効）。
      </p>

      <div className="mt-3 flex items-center gap-2">
        <select
          className="h-10 rounded-lg border border-enadia-line bg-white px-3 text-sm"
          onChange={(event) => setRole(event.target.value as InviteLinkRole)}
          value={role}
        >
          <option value="editor">editor</option>
          <option value="viewer">viewer</option>
        </select>
        <Button icon={<LinkIcon className="h-4 w-4" aria-hidden="true" />} loading={loading} onClick={issueInviteLink} size="sm">
          招待リンクを発行する
        </Button>
      </div>

      {error ? <p className="mt-2 text-xs text-enadia-danger">{error}</p> : null}

      {inviteUrl ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-enadia-line bg-slate-50 p-2">
          <input className="flex-1 truncate bg-transparent text-xs text-enadia-ink outline-none" readOnly value={inviteUrl} />
          <button
            aria-label="URLをコピー"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-enadia-muted hover:text-enadia-primary"
            onClick={copyUrl}
            type="button"
          >
            {copied ? <Check className="h-4 w-4 text-enadia-primary" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      ) : null}
    </div>
  );
}
