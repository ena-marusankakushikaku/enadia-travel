'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/common/AppShell';
import { ConquestCard } from '@/components/conquest/ConquestCard';
import { JapanConquestMap } from '@/components/conquest/JapanConquestMap';
import { PrefectureDetailSheet } from '@/components/conquest/PrefectureDetailSheet';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { ConquestEntry, ConquestProject, Photo, UserProfile } from '@/types/app';

export default function ConquestPage() {
  const { user, loading: authLoading } = useCurrentUser();

  const [selectedPrefectureId, setSelectedPrefectureId] = useState<number | null>(null);
  const [conquestEntries, setConquestEntries] = useState<ConquestEntry[]>([]);
  const [conquestProjects, setConquestProjects] = useState<ConquestProject[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    if (!user) {
      setDbLoading(false);
      return;
    }

    async function fetchData() {
      setDbLoading(true);

      try {
        const [entriesResult, projectsResult, photosResult, profilesResult] =
          await Promise.all([
            supabase.from('conquest_entries').select('*'),
            supabase
              .from('conquest_projects')
              .select('*')
              .order('created_at', { ascending: false }),
            supabase.from('photos').select('*'),
            supabase.from('public_profiles').select('*'),
          ]);

        if (entriesResult.data) {
          setConquestEntries(entriesResult.data as unknown as ConquestEntry[]);
        }

        if (projectsResult.data) {
          setConquestProjects(projectsResult.data as unknown as ConquestProject[]);
        }

        if (photosResult.data) {
          setPhotos(photosResult.data as unknown as Photo[]);
        }

        if (profilesResult.data) {
          setUsers(profilesResult.data as unknown as UserProfile[]);
        }
      } catch (error) {
        console.error('Failed to fetch conquest data:', error);
      } finally {
        setDbLoading(false);
      }
    }

    fetchData();
  }, [supabase, user]);

  if (authLoading || dbLoading) {
    return (
      <AppShell title="読み込み中...">
        <div className="py-8 text-center text-enadia-muted">
          データを取得しています...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell subtitle="テーマごとの全国制覇" title="制覇">
      <div className="space-y-5">
        <JapanConquestMap
          entries={conquestEntries}
          onSelectPrefecture={setSelectedPrefectureId}
        />

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-enadia-ink">
            制覇プロジェクト
          </h2>

          {conquestProjects.length === 0 ? (
            <p className="text-sm text-enadia-muted">
              プロジェクトがありません。新しく作成してください。
            </p>
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
          photos={photos}
          users={users}
          onClose={() => setSelectedPrefectureId(null)}
          prefectureId={selectedPrefectureId}
        />
      ) : null}
    </AppShell>
  );
}
