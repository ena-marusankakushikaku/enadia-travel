import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth';
import { insertTourismEvent } from '@/lib/tourism-events';
import { getThemePeriodState, mapThemeTemplateRow } from '@/lib/api/themeTemplates';

/**
 * 配布テーマに参加する。
 *
 * 参加すると conquest_projects に1行できる。これが参加記録そのものになるので、
 * 参加テーブルを別に持たない。分けると「参加したのにテーマが無い」
 * 「テーマはあるが参加記録が無い」という食い違いが必ず起きる。
 *
 * 配布テーマは無料プランでも枠を消費しない（自作テーマだけが枠の対象）。
 * ここを枠に含めると、主催者に「参加者は全ユーザーです」と言えなくなる。
 */
export async function POST(request: Request) {
  const { response, supabase, user } = await requireUser();
  if (response || !user) return response;

  const body = (await request.json()) as { templateId?: string };

  if (!body.templateId) {
    return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
  }

  const { data: templateRow, error: templateError } = await supabase
    .from('theme_templates')
    .select('*')
    .eq('id', body.templateId)
    .eq('status', 'published')
    .maybeSingle();

  if (templateError || !templateRow) {
    return NextResponse.json({ error: 'このテーマは見つかりませんでした' }, { status: 404 });
  }

  const template = mapThemeTemplateRow(templateRow);

  if (getThemePeriodState(template) === 'ended') {
    return NextResponse.json({ error: 'このテーマは掲載期間が終了しています' }, { status: 400 });
  }

  // すでに参加していたら、そのテーマへ戻す（離脱していた場合は復帰させる）
  const { data: existing } = await supabase
    .from('conquest_projects')
    .select('id,archived_at')
    .eq('user_id', user.id)
    .eq('template_id', template.id)
    .maybeSingle();

  if (existing) {
    if (existing.archived_at) {
      await supabase
        .from('conquest_projects')
        .update({ archived_at: null })
        .eq('id', existing.id);
    }

    return NextResponse.json({ projectId: existing.id, rejoined: true });
  }

  const { data: project, error } = await supabase
    .from('conquest_projects')
    .insert({
      user_id: user.id,
      name: template.title,
      emoji: template.emoji,
      color: template.color,
      description: template.description,
      category: template.category,
      is_public: false,
      template_id: template.id,
      joined_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await insertTourismEvent('theme_joined', {
    userId: user.id,
    conquestProjectId: project.id,
    metadata: {
      templateId: template.id,
      isSponsored: template.isSponsored,
      title: template.title
    }
  });

  return NextResponse.json({ projectId: project.id, rejoined: false }, { status: 201 });
}

/** 参加をやめる。記録は消さず、一覧から外すだけ */
export async function DELETE(request: Request) {
  const { response, supabase, user } = await requireUser();
  if (response || !user) return response;

  const projectId = new URL(request.url).searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('conquest_projects')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', projectId)
    .eq('user_id', user.id)
    .select('id,template_id')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // RLSに弾かれた更新はエラーではなく「0件更新」で返ってくる
  if (!data) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  await insertTourismEvent('theme_left', {
    userId: user.id,
    conquestProjectId: data.id,
    metadata: { templateId: data.template_id }
  });

  return NextResponse.json({ ok: true });
}
