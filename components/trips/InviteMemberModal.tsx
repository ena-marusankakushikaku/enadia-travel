'use client';

import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import type { TripMember, TripRole, UserProfile } from '@/types/app';

type InviteMemberModalProps = {
  open: boolean;
  onClose: () => void;
  tripId: string;
  candidates: UserProfile[];
  onInvite: (member: TripMember) => void;
};

export function InviteMemberModal({ candidates, onClose, onInvite, open, tripId }: InviteMemberModalProps) {
  const [userId, setUserId] = useState(candidates[0]?.id ?? '');
  const [role, setRole] = useState<TripRole>('viewer');

  function invite() {
    if (!userId) {
      return;
    }

    onInvite({
      id: `member-${Date.now()}`,
      tripId,
      userId,
      role,
      joinedAt: new Date().toISOString()
    });
    onClose();
  }

  return (
    <Modal onClose={onClose} open={open} testId="invite-member-modal" title="メンバーを招待">
      <div className="space-y-4">
        <select className="h-11 w-full rounded-lg border border-enadia-line bg-white px-3" value={userId} onChange={(event) => setUserId(event.target.value)}>
          {candidates.map((user) => (
            <option key={user.id} value={user.id}>
              {user.displayName}
            </option>
          ))}
        </select>
        <select className="h-11 w-full rounded-lg border border-enadia-line bg-white px-3" value={role} onChange={(event) => setRole(event.target.value as TripRole)}>
          <option value="viewer">viewer</option>
          <option value="editor">editor</option>
          <option value="owner">owner</option>
        </select>
        <Button className="w-full" disabled={!userId} onClick={invite}>
          招待する
        </Button>
      </div>
    </Modal>
  );
}
