'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { InviteMemberModal } from '@/components/trips/InviteMemberModal';
import type { TripMember, TripRole, UserProfile } from '@/types/app';

type MemberPanelProps = {
  tripId: string;
  currentUserId: string;
  canManage: boolean;
  members: TripMember[];
  users: UserProfile[];
};

const roleDescriptions: Record<TripRole, string> = {
  owner: '招待、権限変更、削除を管理できます。',
  editor: '写真追加とテーマログ追加ができます。',
  viewer: '閲覧のみできます。'
};

export function MemberPanel({ canManage, currentUserId, members, tripId, users }: MemberPanelProps) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [localMembers, setLocalMembers] = useState(members);
  const memberIds = localMembers.map((member) => member.userId);
  const candidates = users.filter((user) => !memberIds.includes(user.id));

  function changeRole(memberId: string, role: TripRole) {
    setLocalMembers((current) => current.map((member) => (member.id === memberId ? { ...member, role } : member)));
  }

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-enadia-line bg-white p-4">
        <h2 className="text-base font-bold text-enadia-ink">権限の説明</h2>
        <div className="mt-3 space-y-2 text-sm text-enadia-muted">
          {Object.entries(roleDescriptions).map(([role, description]) => (
            <p key={role}>
              <span className="font-bold text-enadia-ink">{role}</span>: {description}
            </p>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-enadia-ink">メンバー</h2>
        {canManage ? (
          <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setIsInviteOpen(true)} size="sm">
            招待
          </Button>
        ) : null}
      </div>

      {localMembers.map((member) => {
        const user = users.find((item) => item.id === member.userId);

        return (
          <article className="rounded-lg border border-enadia-line bg-white p-4" key={member.id}>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-enadia-primary text-sm font-bold text-white">
                {user?.displayName.slice(0, 1) ?? 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-enadia-ink">{user?.displayName ?? 'Unknown'}</p>
                  {member.userId === currentUserId ? (
                    <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-enadia-primary">
                      あなた
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-enadia-muted">{roleDescriptions[member.role]}</p>
              </div>
              {canManage ? (
                <button
                  aria-label={`${user?.displayName ?? 'member'}を削除`}
                  className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-enadia-danger"
                  onClick={() => setLocalMembers((current) => current.filter((item) => item.id !== member.id))}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase text-enadia-muted">
                  {member.role}
                </span>
              )}
            </div>
            {canManage ? (
              <select className="mt-3 h-10 w-full rounded-lg border border-enadia-line bg-white px-3 text-sm" value={member.role} onChange={(event) => changeRole(member.id, event.target.value as TripRole)}>
                <option value="owner">owner</option>
                <option value="editor">editor</option>
                <option value="viewer">viewer</option>
              </select>
            ) : null}
          </article>
        );
      })}

      <InviteMemberModal
        candidates={candidates}
        onClose={() => setIsInviteOpen(false)}
        onInvite={(member) => setLocalMembers((current) => [...current, member])}
        open={isInviteOpen}
        tripId={tripId}
      />
    </section>
  );
}
