import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// GET: list semua link + total klik
export async function GET() {
  const { data: links, error } = await supabaseAdmin
    .from('links')
    .select('*, clicks(count)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Ambil agregasi klik 7 hari terakhir per link
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const { data: daily } = await supabaseAdmin
    .from('clicks')
    .select('link_id, clicked_at')
    .gte('clicked_at', sevenDaysAgo)

  const historyMap: Record<string, number[]> = {}
  daily?.forEach(c => {
    const daysAgo = Math.floor((Date.now() - new Date(c.clicked_at).getTime()) / 86400000)
    const idx = 6 - Math.min(6, daysAgo) // 0 = 6 hari lalu, 6 = hari ini
    if (!historyMap[c.link_id]) historyMap[c.link_id] = Array(7).fill(0)
    historyMap[c.link_id][idx]++
  })

  const enriched = links.map(l => ({
    ...l,
    total_clicks: l.clicks?.[0]?.count ?? 0,
    clicks_last_7_days: historyMap[l.id] || Array(7).fill(0),
  }))

  return NextResponse.json({ links: enriched })
}

// POST: buat link baru
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { destination_url, slug, note, expires_in_days, password } = body

  if (!destination_url || !/^https?:\/\/.+/.test(destination_url)) {
    return NextResponse.json({ error: 'URL tidak valid' }, { status: 400 })
  }
  if (slug && !/^[a-zA-Z0-9_-]{1,64}$/.test(slug)) {
    return NextResponse.json({ error: 'Alias hanya huruf, angka, - dan _' }, { status: 400 })
  }

  let finalSlug = slug?.trim()
  if (!finalSlug) {
    const chars = 'abcdefghijkmnpqrstuvwxyz23456789'
    finalSlug = Array.from(crypto.getRandomValues(new Uint8Array(7)))
      .map(b => chars[b % chars.length]).join('')
  }

  const password_hash = password ? await bcrypt.hash(password, 10) : null
  const expires_at = expires_in_days
    ? new Date(Date.now() + expires_in_days * 86400000).toISOString()
    : null

  const { data, error } = await supabaseAdmin.from('links').insert({
    slug: finalSlug,
    destination_url,
    note: note || '',
    password_hash,
    expires_at,
  }).select().single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Alias sudah dipakai' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ link: data }, { status: 201 })
}