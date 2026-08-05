import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/admin';
import type { ThemeKind } from '@/types/app';

export async function GET() {
  const { response, supabase } = await requireAdmin();
  if (response || !supabase) return response;

  const { data, error } = await supabase
    .from('theme_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ templates: data ?? [] });
}

export async function POST(request: Request) {
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
  };

  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'テーマ名は必須です' }, { status: 400 });
  }

  // スポンサーを選んだら PR 表示は必ず入る。
  // 入稿する人が付け忘れられない形にしておくのが、ステマ規制対応でいちばん確実。
  const isSponsored = Boolean(body.sponsorId) || body.isSponsored === true;

  const { data, error } = await supabase
    .from('theme_templates')
    .insert({
      title: body.title.trim(),
      description: body.description || null,
      emoji: body.emoji || '📍',
      color: body.color || '#0f8b8d',
      category: body.category || 'custom',
      kind: body.kind ?? 'spot',
      sponsor_id: body.sponsorId || null,
      is_sponsored: isSponsored,
      area_label: body.areaLabel || null,
      reward_text: body.rewardText || null,
      terms_url: body.termsUrl || null,
      starts_at: body.startsAt || null,
      ends_at: body.endsAt || null,
      status: 'draft'
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ template: data }, { status: 201 });
}
