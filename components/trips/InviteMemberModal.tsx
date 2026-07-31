'use client';

import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { ASSIGNABLE_ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/constants/roles';
import type { TripRole } from '@/types/app';

type InviteMemberModalProps = {
  open: boolean;
  onClose: () => void;
  tripId: string;
  onInvited: () => void;
};

export function InviteMemberModal({ onClose, onInvited, open, tripId }: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TripRole>('editor');
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
        <label className="block">
          <span className="text-sm font-bold text-enadia-ink">権限</span>
          <select
            className="mt-2 h-11 w-full rounded-lg border border-enadia-line bg-white px-3"
            onChange={(event) => setRole(event.target.value as TripRole)}
            value={role}
          >
            {ASSIGNABLE_ROLES.map((assignable) => (
              <option key={assignable} value={assignable}>
                {ROLE_LABELS[assignable]}
              </option>
            ))}
          </select>
          <span className="mt-1.5 block text-xs text-enadia-muted">{ROLE_DESCRIPTIONS[role]}</span>
        </label>
        {error ? <p className="text-xs text-enadia-danger">{error}</p> : null}
        <Button className="w-full" disabled={!email.trim()} loading={loading} onClick={invite}>
          招待する
        </Button>
      </div>
    </Modal>
  );
}
