import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    const password = String(body.password || '')

    if (!password) {
      return NextResponse.json(
        { error: 'Password wajib diisi.' },
        { status: 400 }
      )
    }

    const { data: link, error } = await supabaseAdmin
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
        { error: 'Link ini sudah kedaluwarsa.' },
        { status: 410 }
      )
    }

    if (link.password) {
      const isValid = await bcrypt.compare(password, link.password)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Password salah.' },
          { status: 401 }
        )
      }
    }

    // Catat klik setelah verifikasi berhasil
    await supabaseAdmin.from('clicks').insert({
      link_id: link.id,
    })

    return NextResponse.json({ url: link.url })
  } catch {
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memverifikasi password.' },
      { status: 500 }
    )
  }
}