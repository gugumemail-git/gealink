import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updates: Record<string, unknown> = {}

    if (typeof body.active === 'boolean') updates.active = body.active
    if (typeof body.url === 'string') updates.url = body.url.trim()
    if (typeof body.note === 'string') updates.note = body.note.trim()
    if (body.expires_at !== undefined) updates.expires_at = body.expires_at

    if (body.password !== undefined) {
      updates.password = body.password
        ? await bcrypt.hash(String(body.password), 10)
        : null
    }

    const { data, error } = await supabaseAdmin
      .from('links')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: 'Gagal memperbarui link.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { error } = await supabaseAdmin
      .from('links')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Gagal menghapus link.' },
      { status: 500 }
    )
  }
}