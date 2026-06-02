import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth';
import { insertTourismEvent } from '@/lib/tourism-events';

export async function GET() {
  const { response, supabase, user } = await requireUser();
  if (response || !user) return response;

  const { data, error } = await supabase
    .from('conquest_projects')
    .select('*, conquest_entries(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ projects: data ?? [] });
}

export async function POST(request: Request) {
  const { response, supabase, user } = await requireUser();
  if (response || !user) return response;

  const body = (await request.json()) as {
    name?: string;
    emoji?: string;
    color?: string;
    description?: string | null;
    category?: string;
    isPublic?: boolean;
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const { data: project, error } = await supabase
    .from('conquest_projects')
    .insert({
      user_id: user.id,
      name: body.name.trim(),
      emoji: body.emoji ?? '🎯',
      color: body.color ?? '#0f8b8d',
      description: body.description ?? null,
      category: body.category ?? 'custom',
      is_public: body.isPublic ?? false
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await insertTourismEvent('conquest_project_created', {
    userId: user.id,
    conquestProjectId: project.id,
    metadata: { name: project.name }
  });

  return NextResponse.json({ project }, { status: 201 });
}
