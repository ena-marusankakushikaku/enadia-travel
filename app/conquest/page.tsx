'use client';

import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { AppShell } from '@/components/common/AppShell';
import { Button } from '@/components/common/Button';
import { ConquestCard } from '@/components/conquest/ConquestCard';
import { JapanConquestMap } from '@/components/conquest/JapanConquestMap';
import { PrefectureDetailSheet } from '@/components/conquest/PrefectureDetailSheet';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function ConquestPage() {
  const { user, loading: authLoading } = useCurrentUser();
  const [selectedPrefectureId, setSelectedPrefectureId] = useState<number | null>(null);
  const [conquestEntries, setConquestEntries] = useState<any[]>([]);
  const [conquestProjects, setConquestProjects] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      setDbLoading(true);
      
      // 1. 制覇記録（エントリ）の取得
      const { data: entries } = await supabase
        .from('conquest_entries')
        .select('*');

      // 2. 制覇プロジェクトの取得
      const { data: projects } = await supabase
        .from('conquest_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (entries) setConquestEntries(entries);
      if (projects) setConquestProjects(projects);
      setDbLoading(false);
    }

    fetchData();
  }, [user, supabase]);

  if (authLoading || dbLoading) {
    return (
      <AppShell title="読み込み中...">
        <div className="text-center py-8 text-enadia-muted">データを取得しています...</div>
      </AppShell>
    );
  }

  // ※プラン制限のロジックは仕様に合わせて調整してください。ここでは暫定的に一律マップを表示します。
  return (
    <AppShell subtitle="テーマごとの全国制覇" title="制覇">
      <div className="space-y-5">
        {/* 本物のDBから取得したデータをMapに引き渡す */}
        <JapanConquestMap entries={conquestEntries} onSelectPrefecture={setSelectedPrefectureId} />
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-enadia-ink">制覇プロジェクト</h2>
          {conquestProjects.length === 0 ? (
            <p className="text-sm text-enadia-muted">プロジェクトがありません。新しく作成してください。</p>
          ) : (
            conquestProjects.map((project) => (
              <ConquestCard key={project.id} project={project} />
            ))
          )}
        </section>
      </div>
  {selectedPrefectureId !== null ? (
  <PrefectureDetailSheet
    entries={conquestEntries}
    projects={conquestProjects}
    photos={allPhotos}
    users={users}
    onClose={() => setSelectedPrefectureId(null)}
    prefectureId={selectedPrefectureId}
  />
) : null}
        prefectureId={selectedPrefectureId}
      />
    </AppShell>
  );
}
