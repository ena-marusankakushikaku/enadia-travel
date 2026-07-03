'use client';

import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import type { TripRole } from '@/types/app';

type InviteMemberModalProps = {
  open: boolean;
  onClose: () => void;
  tripId: string;
  onInvited: () => void;
};

export function InviteMemberModal({ onClose, onInvited, open, tripId }: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TripRole>('viewer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function invite() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return;
    }

    setError(null);
    setLoading(true);
    const response = await fetch('/api/trip-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId, email: trimmedEmail, role })
    });
    const data = (await response.json()) as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? '招待に失敗しました');
      return;
    }

    setEmail('');
    onInvited();
    onClose();
  }

  return (
    <Modal onClose={onClose} open={open} testId="invite-member-modal" title="メンバーを招待">
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-bold text-enadia-ink">メールアドレス</span>
          <input
            className="mt-2 h-11 w-full rounded-lg border border-enadia-line bg-white px-3"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="member@example.com"
            type="email"
            value={email}
          />
        </label>
        <select className="h-11 w-full rounded-lg border border-enadia-line bg-white px-3" value={role} onChange={(event) => setRole(event.target.value as TripRole)}>
          <option value="viewer">viewer</option>
          <option value="editor">editor</option>
          <option value="owner">owner</option>
        </select>
        {error ? <p className="text-xs text-enadia-danger">{error}</p> : null}
        <Button className="w-full" disabled={!email.trim()} loading={loading} onClick={invite}>
          招待する
        </Button>
      </div>
    </Modal>
  );
}
