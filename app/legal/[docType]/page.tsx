import { notFound } from 'next/navigation';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { LEGAL_DOC_LABELS, getPublishedLegalDocument, renderLegalMarkdown } from '@/lib/legal';
import type { LegalDocType } from '@/types/app';

export const dynamic = 'force-dynamic';

const DOC_TYPES: LegalDocType[] = ['terms', 'privacy'];

export default async function LegalPage({ params }: { params: { docType: string } }) {
  if (!DOC_TYPES.includes(params.docType as LegalDocType)) {
    notFound();
  }

  const docType = params.docType as LegalDocType;

  // ログインしていない人も読めるページなので、service_role で取りに行く
  const supabase = createSupabaseServiceClient();
  const document = await getPublishedLegalDocument(supabase, docType);

  return (
    <div className="mx-auto min-h-dvh max-w-[720px] bg-white px-5 py-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-enadia-primary">ENADIA Travel</p>
      <h1 className="mt-1 text-xl font-bold text-enadia-ink">
        {document?.title ?? LEGAL_DOC_LABELS[docType]}
      </h1>

      {document ? (
        <>
          <p className="mt-1 text-xs text-enadia-muted">
            バージョン {document.version}
            {document.effectiveOn ? ` ・ ${document.effectiveOn} 施行` : ''}
          </p>
          {document.summary ? (
            <div className="mt-4 rounded-lg border border-enadia-line bg-enadia-canvas p-4 text-sm text-enadia-ink">
              {document.summary}
            </div>
          ) : null}
          <article
            className="legal-body mt-6 text-sm leading-relaxed text-enadia-ink"
            // 本文は管理画面から入る Markdown。renderLegalMarkdown が HTML をエスケープしてから
            // 見出し・箇条書き・強調だけを組み立てるので、タグがそのまま実行されることはない。
            dangerouslySetInnerHTML={{ __html: renderLegalMarkdown(document.body) }}
          />
        </>
      ) : (
        <p className="mt-6 text-sm text-enadia-muted">
          現在公開されている{LEGAL_DOC_LABELS[docType]}はありません。
        </p>
      )}
    </div>
  );
}
