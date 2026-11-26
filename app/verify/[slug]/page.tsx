import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function VerifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { slug } = await params
  const { error } = await searchParams

  async function verifyPassword(formData: FormData) {
    'use server'

    const inputPassword = String(formData.get('password') || '')

    const { data: link } = await supabaseAdmin
      .from('links')
      .select('id, url, active, expires_at, password')
      .eq('slug', slug)
      .single()

    if (!link || !link.active) {
      redirect(`/verify/${slug}?error=notfound`)
    }

    if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
      redirect(`/verify/${slug}?error=expired`)
    }

    if (!link.password) {
      redirect(link.url)
    }

    const isValid = await bcrypt.compare(inputPassword, link.password)
    if (!isValid) {
      redirect(`/verify/${slug}?error=invalid`)
    }

    await supabaseAdmin.from('clicks').insert({
      link_id: link.id,
    })

    redirect(link.url)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '16px',
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="card-header">
          <span className="card-title">Link Terproteksi</span>
          <span className="chip chip-warning">Password</span>
        </div>

        <form action={verifyPassword} className="card-body">
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            Masukkan password untuk membuka tujuan dari{' '}
            <strong style={{ color: 'var(--primary)' }}>
              gea.my.id/{slug}
            </strong>
          </p>

          {error === 'invalid' && (
            <div
              style={{
                background: 'var(--danger-soft)',
                color: 'var(--danger)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '14px',
              }}
            >
              Password salah. Silakan coba lagi.
            </div>
          )}

          {error === 'expired' && (
            <div
              style={{
                background: 'var(--danger-soft)',
                color: 'var(--danger)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '14px',
              }}
            >
              Link ini sudah kedaluwarsa.
            </div>
          )}

          {error === 'notfound' && (
            <div
              style={{
                background: 'var(--danger-soft)',
                color: 'var(--danger)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '14px',
              }}
            >
              Link tidak ditemukan atau sedang nonaktif.
            </div>
          )}

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Masukkan password..."
              autoFocus
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Buka Link
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}