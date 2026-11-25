'use client'
import useSWR from 'swr'
import { useState } from 'react'
import StatsGrid from './StatsGrid'
import CreateForm from './CreateForm'
import LinkTable from './LinkTable'
import DetailDrawer from './DetailDrawer'
import ThemeToggle from './ThemeToggle'
import type { LinkWithStats } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function Dashboard() {
  const { data, error, mutate, isLoading } = useSWR<{ links: LinkWithStats[] }>(
    '/api/links',
    fetcher,
    { refreshInterval: 30000 } // auto-refresh tiap 30 detik
  )
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const links = data?.links ?? []

  if (error) return <div className="p-8 text-red-500">Gagal memuat data.</div>

  return (
    <div className="app">
      {/* Sidebar & topbar: port dari prototype HTML */}
      <main className="main">
        <header className="topbar">
          <div className="search-box">
            <input placeholder="Cari link..." />
          </div>
          <div className="topbar-actions">
            <ThemeToggle />
          </div>
        </header>

        <div className="content">
          <div className="page-header">
            <div>
              <h1 className="page-title">Dashboard</h1>
              <p className="page-sub">Kelola semua shortlink kamu di gea.my.id</p>
            </div>
          </div>

          <StatsGrid links={links} />
          <CreateForm onCreated={() => mutate()} />
          <LinkTable
            links={links}
            loading={isLoading}
            onOpen={(id) => setDrawerId(id)}
            onRefresh={() => mutate()}
          />
        </div>
      </main>

      <DetailDrawer
        linkId={drawerId}
        links={links}
        onClose={() => setDrawerId(null)}
        onRefresh={() => mutate()}
      />
    </div>
  )
}