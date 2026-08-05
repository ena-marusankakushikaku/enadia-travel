import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/admin';
import type { Database } from '@/types/db';
import type { ThemeKind, ThemeStatus } from '@/types/app';

type TemplateUpdate = Database['public']['Tables']['theme_templates']['Update'];

export async function PATCH(
  request: Request,
  { params }: { params: { templateId: string } }
) {
  const { response, supabase } = await requireAdmin();
  if (response || !supabase) return response;

  const body = (await request.json()) as {
    title?: string;
    description?: string | null;
    emoji?: string;
    color?: string;
    category?: string;
    kind?: ThemeKind;
    sponsorId?: string | null;
    isSponsored?: boolean;
    areaLabel?: string | null;
    rewardText?: string | null;
    termsUrl?: string | null;
    startsAt?: string | null;
    endsAt?: string | null;
    status?: ThemeStatus;
  };

  const update: TemplateUpdate = { updated_at: new Date().toISOString() };

  if (body.title !== undefined) update.title = body.title.trim();
  if (body.description !== undefined) update.description = body.description || null;
  if (body.emoji !== undefined) update.emoji = body.emoji || '📍';
  if (body.color !== undefined) update.color = body.color;
  if (body.category !== undefined) update.category = body.category;
  if (body.kind !== undefined) update.kind = body.kind;
  if (body.areaLabel !== undefined) update.area_label = body.areaLabel || null;
  if (body.rewardText !== undefined) update.reward_text = body.rewardText || null;
  if (body.termsUrl !== undefined) update.terms_url = body.termsUrl || null;
  if (body.startsAt !== undefined) update.starts_at = body.startsAt || null;
  if (body.endsAt !== undefined) update.ends_at = body.endsAt || null;

  if (body.sponsorId !== undefined) {
    update.sponsor_id = body.sponsorId || null;
    // スポンサーが付いているあいだは PR 表示を外せない
    if (body.sponsorId) {
      update.is_sponsored = true;
    }
  }

  if (body.isSponsored !== undefined && !update.is_sponsored) {
    update.is_sponsored = body.isSponsored;
  }

  if (body.status !== undefined) {
    update.status = body.status;
    update.published_at = body.status === 'published' ? new Date().toISOString() : null;
  }

  // 公開に切り替えるときだけ、出せる状態かを確認する。
  // 下書きのあいだは途中の状態を許して、入稿の途中で保存できるようにしておく。
  if (body.status === 'published') {
    const { data: current } = await supabase
      .from('theme_templates')
      .select('kind,sponsor_id,is_sponsored')
      .eq('id', params.templateId)
      .single();

    const kind = update.kind ?? current?.kind ?? 'spot';

    if (kind === 'spot') {
      const { count } = await supabase
        .from('theme_spots')
        .select('id', { count: 'exact', head: true })
        .eq('template_id', params.templateId);

      if ((count ?? 0) === 0) {
        return NextResponse.json(
          { error: 'スポットが1つも登録されていないため公開できません' },
          { status: 400 }
        );
      }
    }

    const sponsorId = update.sponsor_id !== undefined ? update.sponsor_id : current?.sponsor_id;
    const isSponsored = update.is_sponsored ?? current?.is_sponsored ?? false;

    if (isSponsored && !sponsorId) {
      return NextResponse.json(
        { error: 'PR表示をするテーマには提供元（スポンサー）が必要です' },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from('theme_templates')
    .update(update)
    .eq('id', params.templateId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ template: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { templateId: string } }
) {
  const { response, supabase } = await requireAdmin();
  if (response || !supabase) return response;

  // 参加者がいるテーマは消さない。
  // 消すと、参加した人の記録から「どのテーマだったか」が失われる。
  const { count } = await supabase
    .from('conquest_projects')
    .select('id', { count: 'exact', head: true })
    .eq('template_id', params.templateId);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: `${count}人が参加しているため削除できません。掲載終了（closed）にしてください` },
      { status: 400 }
    );
  }

  const { error } = await supabase.from('theme_templates').delete().eq('id', params.templateId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
