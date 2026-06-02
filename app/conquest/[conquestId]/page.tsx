'use client';

import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/common/AppShell';
import { Button } from '@/components/common/Button';
import { ConquestDetail } from '@/components/conquest/ConquestDetail';
import { mockCurrentUserId, mockPhotos, mockUsers } from '@/constants/mockData';
import { getConquestProjectById } from '@/lib/mockQueries';

export default function ConquestDetailPage() {
  const params = useParams<{ conquestId: string }>();
  const router = useRouter();
  const project = getConquestProjectById(params.conquestId);

  if (!project) {
    return (
      <AppShell title="制覇テーマが見つかりません">
        <Button onClick={() => router.push('/conquest')} variant="secondary">
          制覇へ戻る
        </Button>
      </AppShell>
    );
  }

  return (
    <AppShell subtitle="制覇詳細" title={project.name}>
      <ConquestDetail photos={mockPhotos} project={project} userId={mockCurrentUserId} users={mockUsers} />
    </AppShell>
  );
}
