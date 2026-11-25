// app/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params

  // Pakai anon key untuk baca (RLS sudah izinkan SELECT)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: link } = await supabase
    .from('links')
    .select('id, destination_url, is_active, expires_at, password_hash')
    .eq('slug', slug)
    .single()

  // 404: slug tidak ada
  if (!link) return new NextResponse('Not Found', { status: 404 })

  // 410: link nonaktif atau expired
  if (!link.is_active) return new NextResponse('Link disabled', { status: 410 })
  if (link.expires_at && new Date(link.expires_at) < new Date())
    return new NextResponse('Link expired', { status: 410 })

  // Jika ada password, redirect ke halaman verify dulu
  if (link.password_hash) {
    return NextResponse.redirect(new URL(`/verify/${slug}`, request.url))
  }

  // Fire-and-forget: catat klik tanpa menunggu (redirect tetap cepat)
  const country = request.headers.get('x-vercel-ip-country') || 'XX'
  const ua = request.headers.get('user-agent') || ''
  const device = /mobile/i.test(ua) ? 'mobile' : /tablet|ipad/i.test(ua) ? 'tablet' : 'desktop'

  supabase.from('clicks').insert({
    link_id: link.id,
    country,
    device_type: device,
    referrer: request.headers.get('referer')?.slice(0, 500) || null,
  }).then(() => {}) // sengaja tidak di-await

  // Redirect 302 (temporary, aman untuk link yang bisa diubah)
  return NextResponse.redirect(link.destination_url, {
    status: 302,
    headers: { 'Cache-Control': 'no-store' },
  })
}