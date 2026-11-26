import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generateSlug(len = 6) {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export async function GET() {
  try {
    const { data: links, error } = await supabaseAdmin
      .from('links')
      .select('id, slug, url, note, password, active, created_at, expires_at')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: clicks } = await supabaseAdmin
      .from('clicks')
      .select('link_id, created_at')

    const now = Date.now()
    const dayMs = 86400000

    const formatted = (links || []).map((link) => {
      const linkClicks = (clicks || []).filter((c) => c.link_id === link.id)
      const history = Array(7).fill(0)

      linkClicks.forEach((c) => {
        if (!c.created_at) return
        const diffDays = Math.floor((now - new Date(c.created_at).getTime()) / dayMs)
        if (diffDays >= 0 && diffDays < 7) {
          history[6 - diffDays] += 1
        }
      })

      return {
        id: link.id,
        slug: link.slug,
        url: link.url,
        note: link.note,
        hasPassword: Boolean(link.password),
        active: link.active,
        created_at: link.created_at,
        expires_at: link.expires_at,
        clicks: linkClicks.length,
        clicksHistory: history,
      }
    })

    return NextResponse.json({ links: formatted })
  } catch {
    return NextResponse.json(
      { error: 'Gagal mengambil daftar link.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const rawUrl = String(body.url || body.targetUrl || body.target || '').trim()

    if (!rawUrl || !isValidHttpUrl(rawUrl)) {
      return NextResponse.json(
        { error: 'URL tujuan tidak valid. Pastikan diawali http:// atau https://' },
        { status: 400 }
      )
    }

    let slug = String(body.slug || '').trim()
    if (slug) {
      if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
        return NextResponse.json(
          { error: 'Alias hanya boleh berisi huruf, angka, tanda hubung (-), atau garis bawah (_).' },
          { status: 400 }
        )
      }

      const { data: existing } = await supabaseAdmin
        .from('links')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

      if (existing) {
        return NextResponse.json(
          { error: 'Alias sudah digunakan, silakan pilih alias lain.' },
          { status: 409 }
        )
      }
    } else {
      let isUnique = false
      while (!isUnique) {
        slug = generateSlug(6)
        const { data: existing } = await supabaseAdmin
          .from('links')
          .select('id')
          .eq('slug', slug)
          .maybeSingle()
        if (!existing) isUnique = true
      }
    }

    const hashedPassword = body.password
      ? await bcrypt.hash(String(body.password), 10)
      : null

    const { data: created, error } = await supabaseAdmin
      .from('links')
      .insert({
        slug,
        url: rawUrl,
        note: body.note ? String(body.note).trim() : null,
        password: hashedPassword,
        expires_at: body.expires_at || null,
        active: true,
      })
      .select('id, slug, url, note, active, created_at, expires_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(created, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menyimpan link.' },
      { status: 500 }
    )
  }
}