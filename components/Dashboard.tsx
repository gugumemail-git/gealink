'use client'

import React, { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { QRCodeSVG } from 'qrcode.react'

interface LinkItem {
  id: string
  slug: string
  url: string
  note?: string | null
  password?: string | null
  hasPassword?: boolean
  created_at?: string | number
  createdAt?: string | number
  expires_at?: string | number | null
  expiresAt?: string | number | null
  clicks?: number
  active?: boolean
  clicks_history?: number[]
  clicksHistory?: number[]
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (res.status === 401) {
    window.location.href = '/login'
    throw new Error('Sesi berakhir, silakan login kembali')
  }
  if (!res.ok) throw new Error('Gagal memuat data')
  return res.json()
}

function isValidUrl(str: string) {
  try {
    const u = new URL(str)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function toTimestamp(val?: string | number | null): number | null {
  if (!val) return null
  if (typeof val === 'number') return val
  const parsed = Date.parse(val)
  return Number.isNaN(parsed) ? null : parsed
}

function fmtDate(val?: string | number | null) {
  const ts = toTimestamp(val)
  if (!ts) return '-'
  return new Date(ts).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function Dashboard() {
  const { data, mutate, isLoading } = useSWR('/api/links', fetcher)

  const links: LinkItem[] = useMemo(() => {
    if (Array.isArray(data)) return data
    if (data && Array.isArray(data.links)) return data.links
    return []
  }, [data])

  // Theme & UI state
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeNav, setActiveNav] = useState<'dashboard' | 'links'>('dashboard')

  // Search, Filter, Sort
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'protected'>('all')
  const [sortKey, setSortKey] = useState<'slug' | 'url' | 'status' | 'clicks' | 'createdAt'>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Form state
  const [urlInput, setUrlInput] = useState('')
  const [slugInput, setSlugInput] = useState('')
  const [expiryInput, setExpiryInput] = useState('0')
  const [passInput, setPassInput] = useState('')
  const [noteInput, setNoteInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Drawer & Toast state
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: 'success' | 'error' }[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('gealink_theme')
    const initial = saved === 'dark' ? 'dark' : 'light'
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('gealink_theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, msg, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2600)
  }

  function getLinkMeta(l: LinkItem) {
    const createdTs = toTimestamp(l.createdAt ?? l.created_at) ?? 0
    const expiresTs = toTimestamp(l.expiresAt ?? l.expires_at)
    const isActive = l.active !== false
    const isExpired = Boolean(expiresTs && expiresTs < Date.now())
    const isProtected = Boolean(l.password || l.hasPassword)
    const clicks = Number(l.clicks ?? 0)
    const history = l.clicksHistory ?? l.clicks_history ?? [0, 0, 0, 0, 0, 0, clicks]
    return { createdTs, expiresTs, isActive, isExpired, isProtected, clicks, history }
  }

  function getStatus(l: LinkItem) {
    const meta = getLinkMeta(l)
    if (!meta.isActive) return { label: 'Nonaktif', cls: 'chip-danger', order: 0 }
    if (meta.isExpired) return { label: 'Expired', cls: 'chip-danger', order: 1 }
    return { label: 'Aktif', cls: 'chip-success', order: 2 }
  }

  // Stats
  const stats = useMemo(() => {
    const total = links.length
    const totalClicks = links.reduce((acc, l) => acc + Number(l.clicks ?? 0), 0)
    const activeCount = links.filter((l) => {
      const m = getLinkMeta(l)
      return m.isActive && !m.isExpired
    }).length
    const avg = total > 0 ? Math.round(totalClicks / total) : 0
    return { total, totalClicks, activeCount, avg }
  }, [links])

  // Filtered & sorted rows
  const filteredLinks = useMemo(() => {
    const q = search.toLowerCase().trim()
    return links
      .filter((l) => {
        const meta = getLinkMeta(l)
        if (q) {
          const hay = `${l.slug} ${l.url} ${l.note || ''}`.toLowerCase()
          if (!hay.includes(q)) return false
        }
        if (filter === 'active') return meta.isActive && !meta.isExpired
        if (filter === 'expired') return meta.isExpired
        if (filter === 'protected') return meta.isProtected
        return true
      })
      .sort((a, b) => {
        const ma = getLinkMeta(a)
        const mb = getLinkMeta(b)
        let va: string | number = 0
        let vb: string | number = 0

        if (sortKey === 'status') {
          va = getStatus(a).order
          vb = getStatus(b).order
        } else if (sortKey === 'clicks') {
          va = ma.clicks
          vb = mb.clicks
        } else if (sortKey === 'createdAt') {
          va = ma.createdTs
          vb = mb.createdTs
        } else {
          va = String(a[sortKey] || '')
          vb = String(b[sortKey] || '')
        }

        if (va < vb) return sortDir === 'asc' ? -1 : 1
        if (va > vb) return sortDir === 'asc' ? 1 : -1
        return 0
      })
  }, [links, search, filter, sortKey, sortDir])

  const selectedLink = useMemo(
    () => links.find((l) => l.id === selectedId) || null,
    [links, selectedId]
  )

  function handleSort(key: typeof sortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function resetForm() {
    setUrlInput('')
    setSlugInput('')
    setExpiryInput('0')
    setPassInput('')
    setNoteInput('')
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const cleanUrl = urlInput.trim()
    const cleanSlug = slugInput.trim()

    if (!cleanUrl || !isValidUrl(cleanUrl)) {
      return showToast('URL tidak valid (gunakan http:// atau https://)', 'error')
    }
    if (cleanSlug && !/^[a-zA-Z0-9_-]+$/.test(cleanSlug)) {
      return showToast('Alias hanya boleh huruf, angka, - dan _', 'error')
    }

    setSubmitting(true)
    try {
      const expiryDays = parseInt(expiryInput, 10)
      const expiresAt =
        expiryDays > 0 ? new Date(Date.now() + expiryDays * 86400000).toISOString() : null

      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: cleanUrl,
          slug: cleanSlug || undefined,
          expires_at: expiresAt,
          password: passInput.trim() || null,
          note: noteInput.trim() || null,
        }),
      })

      if (res.status === 401) {
        window.location.href = '/login'
        return
      }

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || 'Gagal membuat link')
      }

      resetForm()
      await mutate()
      showToast(`Link berhasil dibuat: gea.my.id/${result.slug || cleanSlug}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan'
      showToast(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleActive(link: LinkItem) {
    try {
      const nextActive = link.active === false
      const res = await fetch(`/api/links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextActive }),
      })
      if (res.status === 401) {
        window.location.href = '/login'
        return
      }
      if (!res.ok) throw new Error('Gagal mengubah status link')
      await mutate()
      showToast(nextActive ? 'Link diaktifkan' : 'Link dinonaktifkan')
    } catch {
      showToast('Gagal memperbarui status', 'error')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus link ini secara permanen?')) return
    try {
      const res = await fetch(`/api/links/${id}`, { method: 'DELETE' })
      if (res.status === 401) {
        window.location.href = '/login'
        return
      }
      if (!res.ok) throw new Error('Gagal menghapus link')
      if (selectedId === id) setSelectedId(null)
      await mutate()
      showToast('Link berhasil dihapus')
    } catch {
      showToast('Gagal menghapus link', 'error')
    }
  }

  function copyLink(slug: string) {
    navigator.clipboard
      .writeText(`https://gea.my.id/${slug}`)
      .then(() => showToast('Link disalin ke clipboard'))
      .catch(() => showToast('Gagal menyalin link', 'error'))
  }

  function renderSparkline(values: number[]) {
    const dataPts = values.length > 1 ? values : [0, ...values]
    const max = Math.max(1, ...dataPts)
    const w = 60
    const h = 20
    const step = w / Math.max(1, dataPts.length - 1)
    const pts = dataPts.map((v, i) => `${i * step},${h - (v / max) * (h - 4) - 2}`).join(' ')
    return (
      <svg className="sparkline" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pts}
        />
      </svg>
    )
  }

  function renderMiniChart(values: number[]) {
    const dataPts = values.length === 7 ? values : [0, 0, 0, 0, 0, 0, values[0] || 0]
    const w = 100
    const h = 100
    const pad = 4
    const max = Math.max(1, ...dataPts)
    const barW = (w - pad * 2) / dataPts.length

    return (
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '100px' }} preserveAspectRatio="none">
        {dataPts.map((v, i) => {
          const bh = (v / max) * (h - pad * 2 - 10)
          const x = pad + i * barW + 2
          const y = h - pad - bh
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barW - 4}
              height={Math.max(2, bh)}
              rx="2"
              fill="var(--primary)"
              opacity={0.4 + (v / max) * 0.6}
            />
          )
        })}
      </svg>
    )
  }

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-logo">G</div>
          <div>
            <div className="brand-name">Gealink</div>
            <div className="brand-sub">gea.my.id</div>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-label">Menu</div>
          <button
            type="button"
            className={`nav-item ${activeNav === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              setActiveNav('dashboard')
              setSidebarOpen(false)
            }}
          >
            <svg className="icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Dashboard
          </button>

          <button
            type="button"
            className={`nav-item ${activeNav === 'links' ? 'active' : ''}`}
            onClick={() => {
              setActiveNav('links')
              setSidebarOpen(false)
              document.getElementById('linksTableSection')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            <svg className="icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            Semua Link
            <span className="nav-badge">{stats.total}</span>
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="plan-card">
            <div className="plan-title">Gealink Pro</div>
            <div className="plan-desc">Custom domain aktif • gea.my.id</div>
          </div>

          <button
            type="button"
            className="btn btn-danger-ghost"
            style={{ width: '100%', marginTop: '10px', justifyContent: 'center' }}
            onClick={handleLogout}
          >
            Keluar (Logout)
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn mobile-menu-btn"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="Menu"
          >
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="search-box">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari link, slug, atau catatan..."
            />
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="icon-btn theme-toggle"
              onClick={toggleTheme}
              aria-label="Ganti tema"
              title="Ganti tema"
            >
              <svg className="sun" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <svg className="moon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            </button>
          </div>
        </header>

        <div className="content">
          {/* Page Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Dashboard</h1>
              <p className="page-sub">Kelola semua shortlink kamu di gea.my.id</p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => document.getElementById('inpUrl')?.focus()}
            >
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Buat Link Baru
            </button>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-head">
                <span className="stat-label">Total Link</span>
                <div className="stat-icon purple">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </div>
              </div>
              <div className="stat-value">{stats.total.toLocaleString('id-ID')}</div>
              <div className="stat-trend">Semua tautan tersimpan</div>
            </div>

            <div className="stat-card">
              <div className="stat-head">
                <span className="stat-label">Total Klik</span>
                <div className="stat-icon blue">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"
                    />
                  </svg>
                </div>
              </div>
              <div className="stat-value">{stats.totalClicks.toLocaleString('id-ID')}</div>
              <div className="stat-trend up">Akumulasi kunjungan</div>
            </div>

            <div className="stat-card">
              <div className="stat-head">
                <span className="stat-label">Link Aktif</span>
                <div className="stat-icon green">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="stat-value">{stats.activeCount.toLocaleString('id-ID')}</div>
              <div className="stat-trend">Siap diakses</div>
            </div>

            <div className="stat-card">
              <div className="stat-head">
                <span className="stat-label">Rata-rata Klik</span>
                <div className="stat-icon orange">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="stat-value">{stats.avg.toLocaleString('id-ID')}</div>
              <div className="stat-trend">per link</div>
            </div>
          </div>

          {/* Create Form */}
          <div className="card create-form">
            <div className="card-header">
              <span className="card-title">Buat Link Baru</span>
              <span className="chip chip-info">Instan</span>
            </div>
            <form onSubmit={handleCreate} className="card-body">
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="inpUrl">
                    URL Tujuan <span className="hint">wajib</span>
                  </label>
                  <input
                    id="inpUrl"
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://contoh.com/halaman-panjang"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="inpSlug">
                    Alias Kustom <span className="hint">opsional</span>
                  </label>
                  <div className="input-wrap">
                    <span className="input-prefix">gea.my.id/</span>
                    <input
                      id="inpSlug"
                      value={slugInput}
                      onChange={(e) => setSlugInput(e.target.value)}
                      placeholder="promo-2026"
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="inpExpiry">Masa Berlaku</label>
                  <select
                    id="inpExpiry"
                    value={expiryInput}
                    onChange={(e) => setExpiryInput(e.target.value)}
                  >
                    <option value="0">Selamanya</option>
                    <option value="1">1 Hari</option>
                    <option value="7">7 Hari</option>
                    <option value="30">30 Hari</option>
                    <option value="90">90 Hari</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="inpPass">
                    Password <span className="hint">opsional</span>
                  </label>
                  <input
                    id="inpPass"
                    type="text"
                    value={passInput}
                    onChange={(e) => setPassInput(e.target.value)}
                    placeholder="Kosongkan jika publik"
                  />
                </div>

                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="inpNote">
                    Catatan <span className="hint">opsional, untuk kamu sendiri</span>
                  </label>
                  <input
                    id="inpNote"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="mis. untuk kampanye promosi bulan ini"
                  />
                </div>
              </div>

              {(urlInput.trim() || slugInput.trim()) && (
                <div className="live-preview">
                  <span>Preview:</span>
                  <span className="preview-url">gea.my.id/{slugInput.trim() || 'xxxxxx'}</span>
                  <span className="preview-meta">
                    {urlInput.trim() ? (isValidUrl(urlInput.trim()) ? 'URL valid' : 'URL tidak valid') : ''}{' '}
                    · {Number(expiryInput) > 0 ? `${expiryInput} hari` : 'Permanen'}
                  </span>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={resetForm}>
                  Reset
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  {submitting ? 'Menyimpan...' : 'Buat Link'}
                </button>
              </div>
            </form>
          </div>

          {/* Links Table */}
          <div className="card" id="linksTableSection">
            <div className="card-header">
              <span className="card-title">Daftar Link</span>
              <div className="filters">
                {(['all', 'active', 'expired', 'protected'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`filter-btn ${filter === f ? 'active' : ''}`}
                    onClick={() => setFilter(f)}
                  >
                    {f === 'all' && 'Semua'}
                    {f === 'active' && 'Aktif'}
                    {f === 'expired' && 'Expired'}
                    {f === 'protected' && 'Password'}
                  </button>
                ))}
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th
                      className={sortKey === 'slug' ? 'sorted' : ''}
                      onClick={() => handleSort('slug')}
                    >
                      Short Link <span className="sort-icon">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    </th>
                    <th
                      className={sortKey === 'url' ? 'sorted' : ''}
                      onClick={() => handleSort('url')}
                    >
                      Target <span className="sort-icon">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    </th>
                    <th
                      className={sortKey === 'status' ? 'sorted' : ''}
                      onClick={() => handleSort('status')}
                    >
                      Status <span className="sort-icon">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    </th>
                    <th
                      className={sortKey === 'clicks' ? 'sorted' : ''}
                      onClick={() => handleSort('clicks')}
                    >
                      Klik <span className="sort-icon">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    </th>
                    <th
                      className={sortKey === 'createdAt' ? 'sorted' : ''}
                      onClick={() => handleSort('createdAt')}
                    >
                      Dibuat <span className="sort-icon">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    </th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {!isLoading &&
                    filteredLinks.map((l) => {
                      const st = getStatus(l)
                      const meta = getLinkMeta(l)
                      return (
                        <tr
                          key={l.id}
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest('button')) return
                            setSelectedId(l.id)
                          }}
                        >
                          <td>
                            <div className="link-cell">
                              <span className="link-slug">/{l.slug}</span>
                              {l.note && <span className="link-note">{l.note}</span>}
                            </div>
                          </td>
                          <td>
                            <span className="link-target" title={l.url}>
                              {l.url}
                            </span>
                          </td>
                          <td>
                            <span className={`chip ${st.cls}`}>{st.label}</span>
                          </td>
                          <td>
                            <div className="clicks-cell">
                              <span className="clicks-num">{meta.clicks.toLocaleString('id-ID')}</span>
                              {renderSparkline(meta.history)}
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                            {fmtDate(l.createdAt ?? l.created_at)}
                          </td>
                          <td>
                            <div className="row-actions">
                              <button
                                type="button"
                                className="icon-btn"
                                style={{ width: '32px', height: '32px' }}
                                title="Salin link"
                                onClick={() => copyLink(l.slug)}
                              >
                                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                              </button>

                              <button
                                type="button"
                                className="icon-btn"
                                style={{ width: '32px', height: '32px' }}
                                title="Detail & QR Code"
                                onClick={() => setSelectedId(l.id)}
                              >
                                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                                  />
                                </svg>
                              </button>

                              <button
                                type="button"
                                className="icon-btn"
                                style={{ width: '32px', height: '32px' }}
                                title={meta.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                                onClick={() => handleToggleActive(l)}
                              >
                                {meta.isActive ? (
                                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                ) : (
                                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>

            {isLoading && (
              <div className="empty-state">
                <h3>Memuat data link...</h3>
              </div>
            )}

            {!isLoading && filteredLinks.length === 0 && (
              <div className="empty-state">
                <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                <h3>Belum ada link</h3>
                <p>Buat shortlink pertama kamu di form di atas</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Detail Drawer */}
      <div
        className={`drawer-overlay ${selectedLink ? 'show' : ''}`}
        onClick={() => setSelectedId(null)}
      />
      <aside className={`drawer ${selectedLink ? 'show' : ''}`}>
        <div className="drawer-header">
          <span className="drawer-title">Detail Link</span>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setSelectedId(null)}
            aria-label="Tutup"
          >
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {selectedLink && (() => {
          const st = getStatus(selectedLink)
          const meta = getLinkMeta(selectedLink)
          return (
            <div className="drawer-body">
              <div className="detail-group">
                <div className="detail-label">Short URL</div>
                <div
                  className="detail-value"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}
                >
                  <span>gea.my.id/{selectedLink.slug}</span>
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ width: '28px', height: '28px' }}
                    title="Salin"
                    onClick={() => copyLink(selectedLink.slug)}
                  >
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="detail-group">
                <div className="detail-label">URL Tujuan</div>
                <div className="detail-value">{selectedLink.url}</div>
              </div>

              <div className="detail-group">
                <div className="detail-label">Status</div>
                <div>
                  <span className={`chip ${st.cls}`}>{st.label}</span>
                  {meta.isProtected && (
                    <span className="chip chip-warning" style={{ marginLeft: '6px' }}>
                      Password
                    </span>
                  )}
                </div>
              </div>

              <div className="detail-group">
                <div className="detail-label">Statistik</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="stat-card" style={{ padding: '12px' }}>
                    <div className="stat-label">Total Klik</div>
                    <div className="stat-value" style={{ fontSize: '20px' }}>
                      {meta.clicks.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="stat-card" style={{ padding: '12px' }}>
                    <div className="stat-label">Dibuat</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px' }}>
                      {fmtDate(selectedLink.createdAt ?? selectedLink.created_at)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-group">
                <div className="detail-label">Tren 7 Hari</div>
                <div className="stat-card" style={{ padding: '12px' }}>
                  {renderMiniChart(meta.history)}
                </div>
              </div>

              <div className="detail-group">
                <div className="detail-label">QR Code</div>
                <div className="qr-container">
                  <div id="qrcode">
                    <QRCodeSVG value={`https://gea.my.id/${selectedLink.slug}`} size={160} />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    Scan untuk membuka link
                  </span>
                </div>
              </div>

              {selectedLink.note && (
                <div className="detail-group">
                  <div className="detail-label">Catatan</div>
                  <div className="detail-value plain">{selectedLink.note}</div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => handleToggleActive(selectedLink)}
                >
                  {meta.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <button
                  type="button"
                  className="btn btn-danger-ghost"
                  style={{ flex: 1 }}
                  onClick={() => handleDelete(selectedLink.id)}
                >
                  Hapus
                </button>
              </div>
            </div>
          )
        })()}
      </aside>

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast show ${t.type}`}>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  )
}