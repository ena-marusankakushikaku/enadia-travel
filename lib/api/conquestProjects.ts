import type { Database } from '@/types/db';
import type { ConquestProject, ConquestThemeCategory } from '@/types/app';

type ConquestProjectRow = Database['public']['Tables']['conquest_projects']['Row'];

export function mapConquestProjectRow(row: ConquestProjectRow): ConquestProject {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    emoji: row.emoji,
    color: row.color,
    description: row.description,
    category: row.category as ConquestThemeCategory,
    isPublic: row.is_public,
    entries: []
  };
}
