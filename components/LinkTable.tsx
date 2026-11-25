'use client'
import type { LinkWithStats } from '@/lib/types'

interface Props {
  links: LinkWithStats[]
  loading: boolean
  onOpen: (id: string) => void
  onRefresh: () => void
}

export default function LinkTable({ links, loading, onOpen, onRefresh }: Props) {
  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/links/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    })
    onRefresh()
  }

  async function remove(id: string) {
    if (!confirm('Hapus link ini?')) return
    await fetch(`/api/links/${id}`, { method: 'DELETE' })
    onRefresh()
  }

  if (loading && !links.length) return <div className="card"><div className="card-body">Memuat...</div></div>

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Daftar Link</span>
        <span className="chip chip-neutral">{links.length} link</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Short Link</th><th>Target</th><th>Status</th><th>Klik</th><th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {links.map(l => {
              const expired = l.expires_at && new Date(l.expires_at) < new Date()
              const active = l.is_active && !expired
              return (
                <tr key={l.id} onClick={() => onOpen(l.id)} style={{ cursor: 'pointer' }}>
                  <td><span className="link-slug">/{l.slug}</span></td>
                  <td><span className="link-target">{l.destination_url}</span></td>
                  <td>
                    <span className={`chip ${active ? 'chip-success' : 'chip-danger'}`}>
                      {expired ? 'Expired' : l.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                    {l.password_hash && <span className="chip chip-warning">🔒</span>}
                  </td>
                  <td>{l.total_clicks.toLocaleString()}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="btn btn-sm btn-secondary" onClick={() => toggleActive(l.id, l.is_active)}>
                      {l.is_active ? 'Pause' : 'Aktifkan'}
                    </button>
                    <button className="btn btn-sm btn-danger-ghost" onClick={() => remove(l.id)}>Hapus</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}