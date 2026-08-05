import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/admin';

export async function GET() {
  const { response, supabase } = await requireAdmin();
  if (response || !supabase) return response;

  const { data, error } = await supabase
    .from('sponsors')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sponsors: data ?? [] });
}

export async function POST(request: Request) {
  const { response, supabase } = await requireAdmin();
  if (response || !supabase) return response;

  const body = (await request.json()) as {
    name?: string;
    displayName?: string;
    logoUrl?: string | null;
    contactEmail?: string | null;
    note?: string | null;
    contractStartsOn?: string | null;
    contractEndsOn?: string | null;
  };

  if (!body.name?.trim() || !body.displayName?.trim()) {
    return NextResponse.json({ error: '名称と表示名は必須です' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('sponsors')
    .insert({
      name: body.name.trim(),
      display_name: body.displayName.trim(),
      logo_url: body.logoUrl || null,
      contact_email: body.contactEmail || null,
      note: body.note || null,
      contract_starts_on: body.contractStartsOn || null,
      contract_ends_on: body.contractEndsOn || null
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sponsor: data }, { status: 201 });
}
