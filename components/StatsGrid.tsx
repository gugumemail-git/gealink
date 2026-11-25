'use client'
import type { LinkWithStats } from '@/lib/types'

export default function StatsGrid({ links }: { links: LinkWithStats[] }) {
  const now = Date.now()
  const active = links.filter(l =>
    l.is_active && (!l.expires_at || new Date(l.expires_at).getTime() > now)
  )
  const totalClicks = links.reduce((a, l) => a + (l.total_clicks || 0), 0)
  const avg = links.length ? Math.round(totalClicks / links.length) : 0

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-label">Total Link</div>
        <div className="stat-value">{links.length}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Total Klik</div>
        <div className="stat-value">{totalClicks.toLocaleString()}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Link Aktif</div>
        <div className="stat-value">{active.length}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Rata-rata Klik</div>
        <div className="stat-value">{avg}</div>
      </div>
    </div>
  )
}