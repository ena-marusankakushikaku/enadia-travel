import { mapConquestEntryRow } from '@/lib/api/conquestEntries';
import { mapConquestProjectRow } from '@/lib/api/conquestProjects';
import type { ConquestEntry, ConquestProject } from '@/types/app';
import type { Database } from '@/types/db';

type ConquestProjectRow = Database['public']['Tables']['conquest_projects']['Row'];
type ConquestEntryRow = Database['public']['Tables']['conquest_entries']['Row'];

// Persists a draft ConquestEntry (with a client-generated id) created by ThemeEntryModal,
// creating its ConquestProject first if it doesn't exist yet. Returns the real, DB-backed rows.
export async function persistThemeEntry(
  entry: ConquestEntry,
  project?: ConquestProject
): Promise<{ entry: ConquestEntry; project?: ConquestProject } | null> {
  let projectId = entry.projectId;
  let persistedProject: ConquestProject | undefined;

  if (project) {
    const projectResponse = await fetch('/api/conquest-projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: project.name,
        emoji: project.emoji,
        color: project.color,
        description: project.description,
        category: project.category,
        isPublic: project.isPublic
      })
    });
    const projectData = (await projectResponse.json()) as { project?: ConquestProjectRow; error?: string };
    if (!projectResponse.ok || !projectData.project) {
      return null;
    }
    projectId = projectData.project.id;
    persistedProject = mapConquestProjectRow(projectData.project);
  }

  const entryResponse = await fetch('/api/conquest-entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      tripId: entry.tripId,
      photoId: entry.photoId,
      prefectureId: entry.prefectureId,
      title: entry.title,
      memo: entry.memo,
      rating: entry.rating,
      visitedAt: entry.visitedAt,
      placeName: entry.placeName,
      lat: entry.lat,
      lng: entry.lng,
      source: entry.source,
      metadata: entry.metadata
    })
  });
  const entryData = (await entryResponse.json()) as { entry?: ConquestEntryRow; error?: string };
  if (!entryResponse.ok || !entryData.entry) {
    return null;
  }

  return { entry: mapConquestEntryRow(entryData.entry), project: persistedProject };
}
