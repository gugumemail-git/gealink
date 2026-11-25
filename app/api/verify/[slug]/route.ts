import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { password } = await request.json()
  const { data: link } = await supabaseAdmin
    .from('links')
    .select('destination_url, password_hash, is_active, expires_at')
    .eq('slug', params.slug)
    .single()

  if (!link || !link.is_active) {
    return NextResponse.json({ error: 'Link tidak ditemukan' }, { status: 404 })
  }
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Link expired' }, { status: 410 })
  }
  if (!link.password_hash || !(await bcrypt.compare(password, link.password_hash))) {
    return NextResponse.json({ error: 'Password salah' }, { status: 401 })
  }

  return NextResponse.json({ destination_url: link.destination_url })
}