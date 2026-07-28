'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export function LogoutButton() {
  const { logout } = useCurrentUser();
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    setSigningOut(true);
    try {
      // 成功時はログイン画面へ遷移するため、ここには戻ってこない
      await logout();
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <Button
      className="w-full"
      icon={<LogOut className="h-4 w-4" aria-hidden="true" />}
      loading={signingOut}
      onClick={handleLogout}
      variant="secondary"
    >
      ログアウト
    </Button>
  );
}
