'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal login')
      }

      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-logo" style={{ width: '32px', height: '32px', fontSize: '14px' }}>
              G
            </div>
            <div>
              <div className="card-title">Login Gealink</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>gea.my.id</div>
            </div>
          </div>
          <span className="chip chip-info">Admin</span>
        </div>

        <form onSubmit={handleLogin} className="card-body">
          {error && (
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
              {error}
            </div>
          )}

          <div className="field" style={{ marginBottom: '14px' }}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gea.my.id"
              autoFocus
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password..."
            />
          </div>

          <div className="form-actions" style={{ marginTop: '20px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Memeriksa...' : 'Masuk ke Dashboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}