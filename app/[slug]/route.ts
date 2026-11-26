import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const { data: link, error } = await supabase
    .from('links')
    .select('id, url, active, expires_at, password')
    .eq('slug', slug)
    .single()

  if (error || !link || !link.active) {
    return NextResponse.json(
      { error: 'Link tidak ditemukan atau sedang nonaktif.' },
      { status: 404 }
    )
  }

  if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
    return NextResponse.json(
      { error: 'Link ini sudah kedaluwarsa (expired).' },
      { status: 410 }
    )
  }

  // Jika link diproteksi password, arahkan ke halaman verifikasi
  if (link.password) {
    return NextResponse.redirect(new URL(`/verify/${slug}`, request.url))
  }

  // Catat klik (fire-and-forget)
  void supabase.from('clicks').insert({
    link_id: link.id,
  })

  return NextResponse.redirect(link.url, 302)
}