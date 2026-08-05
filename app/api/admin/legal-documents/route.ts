import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/admin';
import type { LegalDocType } from '@/types/app';

export async function GET() {
  const { response, supabase } = await requireAdmin();
  if (response || !supabase) return response;

  const { data, error } = await supabase
    .from('legal_documents')
    .select('*')
    .order('doc_type')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ documents: data ?? [] });
}

/**
 * 新しいバージョンを作る。
 *
 * 既存の本文を上書きするAPIは用意していない（公開済みの本文は PATCH でも変えられない）。
 * 上書きすると、user_consents に残した version がどの本文を指すのか分からなくなり、
 * 「いつの規約に同意したのか」が説明できなくなるため。
 */
export async function POST(request: Request) {
  const { response, supabase } = await requireAdmin();
  if (response || !supabase) return response;

  const body = (await request.json()) as {
    docType?: LegalDocType;
    version?: string;
    title?: string;
    bodyText?: string;
    summary?: string | null;
    effectiveOn?: string | null;
    requiresReconsent?: boolean;
    copyFromId?: string;
  };

  if (!body.docType || !body.version?.trim() || !body.title?.trim()) {
    return NextResponse.json({ error: '種類・バージョン・タイトルは必須です' }, { status: 400 });
  }

  let text = body.bodyText ?? '';

  // 「いまの規約をコピーして新しいバージョンを作る」を1回の操作でできるようにする
  if (!text && body.copyFromId) {
    const { data: source } = await supabase
      .from('legal_documents')
      .select('body,summary')
      .eq('id', body.copyFromId)
      .maybeSingle();

    text = source?.body ?? '';
  }

  if (!text.trim()) {
    return NextResponse.json({ error: '本文が空です' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('legal_documents')
    .insert({
      doc_type: body.docType,
      version: body.version.trim(),
      title: body.title.trim(),
      body: text,
      summary: body.summary || null,
      effective_on: body.effectiveOn || null,
      requires_reconsent: body.requiresReconsent ?? false,
      status: 'draft'
    })
    .select()
    .single();

  if (error) {
    const message = error.code === '23505' ? 'そのバージョン番号はすでに使われています' : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ document: data }, { status: 201 });
}
