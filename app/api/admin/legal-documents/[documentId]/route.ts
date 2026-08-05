import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/admin';
import type { Database } from '@/types/db';
import type { LegalDocStatus } from '@/types/app';

type LegalUpdate = Database['public']['Tables']['legal_documents']['Update'];

export async function PATCH(request: Request, { params }: { params: { documentId: string } }) {
  const { response, supabase } = await requireAdmin();
  if (response || !supabase) return response;

  const body = (await request.json()) as {
    title?: string;
    bodyText?: string;
    summary?: string | null;
    effectiveOn?: string | null;
    requiresReconsent?: boolean;
    status?: LegalDocStatus;
  };

  const { data: current } = await supabase
    .from('legal_documents')
    .select('id,doc_type,status')
    .eq('id', params.documentId)
    .maybeSingle();

  if (!current) {
    return NextResponse.json({ error: '見つかりません' }, { status: 404 });
  }

  // 公開済みの本文は編集させない。直したいときは新しいバージョンを作る。
  const isEditingText =
    body.title !== undefined || body.bodyText !== undefined || body.summary !== undefined;

  if (current.status === 'published' && isEditingText) {
    return NextResponse.json(
      {
        error:
          '公開中の規約の本文は変更できません。「このバージョンをコピーして新規作成」から新しいバージョンを作ってください'
      },
      { status: 400 }
    );
  }

  const update: LegalUpdate = { updated_at: new Date().toISOString() };

  if (body.title !== undefined) update.title = body.title.trim();
  if (body.bodyText !== undefined) update.body = body.bodyText;
  if (body.summary !== undefined) update.summary = body.summary || null;
  if (body.effectiveOn !== undefined) update.effective_on = body.effectiveOn || null;
  if (body.requiresReconsent !== undefined) update.requires_reconsent = body.requiresReconsent;

  if (body.status !== undefined) {
    update.status = body.status;
    update.published_at = body.status === 'published' ? new Date().toISOString() : null;
  }

  // 公開できるのは同じ種類につき1件だけ。
  // 先に今の公開中を archived に落としてから切り替える（DBの一意制約と合わせる）。
  if (body.status === 'published') {
    await supabase
      .from('legal_documents')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('doc_type', current.doc_type)
      .eq('status', 'published')
      .neq('id', params.documentId);
  }

  const { data, error } = await supabase
    .from('legal_documents')
    .update(update)
    .eq('id', params.documentId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ document: data });
}

export async function DELETE(_request: Request, { params }: { params: { documentId: string } }) {
  const { response, supabase } = await requireAdmin();
  if (response || !supabase) return response;

  const { data: current } = await supabase
    .from('legal_documents')
    .select('status')
    .eq('id', params.documentId)
    .maybeSingle();

  if (current?.status !== 'draft') {
    return NextResponse.json(
      { error: '下書き以外は削除できません（同意の記録が参照しているため）' },
      { status: 400 }
    );
  }

  const { error } = await supabase.from('legal_documents').delete().eq('id', params.documentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
