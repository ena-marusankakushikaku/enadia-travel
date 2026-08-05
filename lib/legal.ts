import type { SupabaseClient } from '@supabase/supabase-js';
import type { LegalDocType, LegalDocument } from '@/types/app';
import type { Database } from '@/types/db';

type LegalDocumentRow = Database['public']['Tables']['legal_documents']['Row'];

export function mapLegalDocumentRow(row: LegalDocumentRow): LegalDocument {
  return {
    id: row.id,
    docType: row.doc_type,
    version: row.version,
    title: row.title,
    body: row.body,
    summary: row.summary,
    status: row.status,
    requiresReconsent: row.requires_reconsent,
    publishedAt: row.published_at,
    effectiveOn: row.effective_on,
    updatedAt: row.updated_at
  };
}

export const LEGAL_DOC_LABELS: Record<LegalDocType, string> = {
  terms: '利用規約',
  privacy: 'プライバシーポリシー'
};

/** いま公開中の規約。まだ1件も無ければ null */
export async function getPublishedLegalDocument(
  supabase: SupabaseClient<Database>,
  docType: LegalDocType
): Promise<LegalDocument | null> {
  const { data } = await supabase
    .from('legal_documents')
    .select('*')
    .eq('doc_type', docType)
    .eq('status', 'published')
    .maybeSingle();

  return data ? mapLegalDocumentRow(data) : null;
}

/**
 * 同意の記録に使う識別子。
 *
 * 「利用規約 v1.2 に同意した」を残すため、必ずバージョンとセットで保存する。
 * 本文を上書きしてしまうと、この version がどの本文を指すのか分からなくなるので、
 * 規約の差し替えは上書きではなく新しい行の追加で行う。
 */
export function consentTypeFor(docType: LegalDocType): string {
  return docType === 'terms' ? 'terms_of_service' : 'privacy_policy';
}

/**
 * Markdown の最小限の整形。
 *
 * 規約に必要なのは見出し・箇条書き・強調・段落だけなので、
 * ライブラリを足さずにここで処理する（依存を増やさない）。
 * HTMLは受け付けず、必ずエスケープしてから組み立てるので、
 * 管理画面から流し込まれた本文でスクリプトが動くことはない。
 */
export function renderLegalMarkdown(markdown: string): string {
  const escape = (text: string) =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const inline = (text: string) =>
    escape(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code>$1</code>');

  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let listOpen = false;

  const closeList = () => {
    if (listOpen) {
      html.push('</ul>');
      listOpen = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    if (heading) {
      closeList();
      const level = Math.min(4, heading[1].length + 1);
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    const bullet = /^[-*]\s+(.*)$/.exec(trimmed);
    if (bullet) {
      if (!listOpen) {
        html.push('<ul>');
        listOpen = true;
      }
      html.push(`<li>${inline(bullet[1])}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${inline(trimmed)}</p>`);
  }

  closeList();
  return html.join('\n');
}
