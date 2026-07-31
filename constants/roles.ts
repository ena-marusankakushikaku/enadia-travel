import type { TripRole } from '@/types/app';

/**
 * 権限の表示名。
 *
 * DBに保存している値（owner / editor / viewer）は変えず、画面上の呼び方だけを日本語にしている。
 * 値そのものを変えるとRLSのポリシーや既存データまで作り直すことになるため。
 *
 * viewer（閲覧のみ）は使いどころが無いと判断し、新しく割り当てられないようにした。
 * 過去に設定されたメンバーが残っている可能性があるので、表示だけは残してある。
 */
export const ROLE_LABELS: Record<TripRole, string> = {
  owner: 'オーナー',
  editor: '参加者',
  viewer: '閲覧のみ'
};

export const ROLE_DESCRIPTIONS: Record<TripRole, string> = {
  owner: '写真の追加に加えて、旅の設定変更・招待・メンバーの管理ができます。',
  editor: '写真やテーマログの追加、旅の期間の変更ができます。',
  viewer: '閲覧だけできます。（現在は新しく割り当てられません）'
};

/** 招待や権限変更で選べる権限。viewerは含めない */
export const ASSIGNABLE_ROLES: TripRole[] = ['owner', 'editor'];

export function getRoleLabel(role: TripRole | null | undefined): string {
  if (!role) {
    return 'メンバーではありません';
  }

  return ROLE_LABELS[role] ?? role;
}
