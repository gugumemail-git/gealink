'use client'
import { useState } from 'react'

export default function CreateForm({ onCreated }: { onCreated: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    destination_url: '', slug: '', note: '', expires_in_days: 0, password: '',
  })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination_url: form.destination_url,
        slug: form.slug || undefined,
        note: form.note,
        expires_in_days: form.expires_in_days || undefined,
        password: form.password || undefined,
      }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) return setError(json.error || 'Gagal membuat link')
    setForm({ destination_url: '', slug: '', note: '', expires_in_days: 0, password: '' })
    onCreated()
  }

  return (
    <form className="card create-form" onSubmit={submit}>
      <div className="card-body">
        <div className="form-grid">
          <div className="field">
            <label>URL Tujuan</label>
            <input
              type="url" required
              value={form.destination_url}
              onChange={e => setForm({ ...form, destination_url: e.target.value })}
              placeholder="https://contoh.com/halaman-panjang"
            />
          </div>
          <div className="field">
            <label>Alias Kustom (opsional)</label>
            <div className="input-wrap">
              <span className="input-prefix">gea.my.id/</span>
              <input
                value={form.slug}
                onChange={e => setForm({ ...form, slug: e.target.value })}
                placeholder="promo-2025"
              />
            </div>
          </div>
          <div className="field">
            <label>Masa Berlaku</label>
            <select
              value={form.expires_in_days}
              onChange={e => setForm({ ...form, expires_in_days: Number(e.target.value) })}
            >
              <option value={0}>Selamanya</option>
              <option value={1}>1 Hari</option>
              <option value={7}>7 Hari</option>
              <option value={30}>30 Hari</option>
            </select>
          </div>
          <div className="field">
            <label>Password (opsional)</label>
            <input
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Kosongkan jika publik"
            />
          </div>
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Menyimpan...' : '+ Buat Link'}
          </button>
        </div>
      </div>
    </form>
  )
}