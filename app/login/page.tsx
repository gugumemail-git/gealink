'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

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
    <div className="login-shell">
      <style>{`
        .login-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          background: var(--bg);
          color: var(--text);
          position: relative;
        }

        /* Panel Kiri: Branding & Visual */
        .login-hero {
          position: relative;
          overflow: hidden;
          background: linear-gradient(145deg, #312e81 0%, #4f46e5 48%, #7c3aed 100%);
          color: #ffffff;
          padding: 48px 56px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .login-hero::before {
          content: '';
          position: absolute;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%);
          top: -120px;
          right: -100px;
          pointer-events: none;
        }
        .login-hero::after {
          content: '';
          position: absolute;
          width: 340px;
          height: 340px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(56,189,248,0.22) 0%, transparent 70%);
          bottom: -90px;
          left: -80px;
          pointer-events: none;
        }

        .hero-top {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          z-index: 1;
        }
        .hero-badge-logo {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.16);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.28);
          display: grid;
          place-items: center;
          font-weight: 800;
          font-size: 19px;
          color: #fff;
        }
        .hero-brand-title {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.4px;
        }
        .hero-brand-domain {
          font-size: 12px;
          opacity: 0.78;
        }

        .hero-center {
          position: relative;
          z-index: 1;
          max-width: 460px;
          margin: auto 0;
        }
        .hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
          border: 1px solid rgba(255, 255, 255, 0.22);
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .hero-pill-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 8px #34d399;
        }
        .hero-heading {
          font-size: 36px;
          font-weight: 800;
          line-height: 1.18;
          letter-spacing: -0.8px;
          margin-bottom: 16px;
        }
        .hero-desc {
          font-size: 15px;
          line-height: 1.65;
          opacity: 0.86;
          margin-bottom: 28px;
        }

        .hero-preview-card {
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 16px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .hero-preview-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
        }
        .hero-preview-slug {
          font-family: 'SF Mono', Monaco, monospace;
          font-weight: 700;
          background: rgba(15, 23, 42, 0.28);
          padding: 5px 10px;
          border-radius: 8px;
        }
        .hero-preview-stat {
          font-size: 12px;
          font-weight: 600;
          color: #a7f3d0;
        }

        .hero-footer {
          position: relative;
          z-index: 1;
          font-size: 12px;
          opacity: 0.75;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* Panel Kanan: Form Login */
        .login-form-side {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 32px 24px;
          position: relative;
        }
        .login-theme-btn {
          position: absolute;
          top: 24px;
          right: 24px;
        }
        .login-box {
          width: 100%;
          max-width: 400px;
        }
        .mobile-brand {
          display: none;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
        }
        .login-header {
          margin-bottom: 28px;
        }
        .login-title {
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.6px;
          margin-bottom: 6px;
        }
        .login-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .input-icon-group {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon-left {
          position: absolute;
          left: 13px;
          width: 17px;
          height: 17px;
          color: var(--text-tertiary);
          pointer-events: none;
        }
        .input-with-icon {
          padding: 11px 14px 11px 40px;
          border-radius: 10px;
          font-size: 14px;
        }
        .input-with-icon.has-right {
          padding-right: 42px;
        }
        .pass-toggle-btn {
          position: absolute;
          right: 10px;
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border-radius: 6px;
          color: var(--text-tertiary);
          transition: all var(--transition);
        }
        .pass-toggle-btn:hover {
          color: var(--text);
          background: var(--bg-subtle);
        }

        .login-submit-btn {
          width: 100%;
          padding: 12px 18px;
          font-size: 14px;
          border-radius: 10px;
          margin-top: 8px;
          box-shadow: 0 6px 18px var(--ring);
        }

        .login-security-note {
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 12px;
          color: var(--text-tertiary);
        }

        @media (max-width: 920px) {
          .login-shell {
            grid-template-columns: 1fr;
          }
          .login-hero {
            display: none;
          }
          .mobile-brand {
            display: flex;
          }
        }
      `}</style>

      {/* Panel Kiri: Visual & Branding */}
      <section className="login-hero">
        <div className="hero-top">
          <div className="hero-badge-logo">G</div>
          <div>
            <div className="hero-brand-title">Gealink</div>
            <div className="hero-brand-domain">gea.my.id</div>
          </div>
        </div>

        <div className="hero-center">
          <div className="hero-pill">
            <span className="hero-pill-dot" />
            Private Shortlink & Analytics
          </div>
          <h2 className="hero-heading">
            Kendali penuh atas setiap tautan pendek Anda.
          </h2>
          <p className="hero-desc">
            Buat alias kustom, lindungi tautan dengan kata sandi, atur masa berlaku otomatis, dan pantau statistik klik secara real-time.
          </p>

          <div className="hero-preview-card">
            <div className="hero-preview-row">
              <span className="hero-preview-slug">gea.my.id/promo-2026</span>
              <span className="hero-preview-stat">● Aktif • 1.284 Klik</span>
            </div>
            <div className="hero-preview-row" style={{ opacity: 0.85, fontSize: '12px' }}>
              <span>Proteksi Password & QR Code Otomatis</span>
              <span>302 Fast Redirect</span>
            </div>
          </div>
        </div>

        <div className="hero-footer">
          <span>© 2026 Gealink Studio</span>
          <span>Secured by Supabase Auth</span>
        </div>
      </section>

      {/* Panel Kanan: Form Login */}
      <section className="login-form-side">
        <button
          type="button"
          className="icon-btn theme-toggle login-theme-btn"
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

        <div className="login-box">
          {/* Logo khusus tampilan mobile */}
          <div className="mobile-brand">
            <div className="brand-logo">G</div>
            <div>
              <div className="brand-name">Gealink</div>
              <div className="brand-sub">gea.my.id</div>
            </div>
          </div>

          <div className="login-header">
            <h1 className="login-title">Selamat Datang Kembali</h1>
            <p className="login-subtitle">
              Masuk dengan akun administrator untuk mengelola shortlink Anda.
            </p>
          </div>

          <form onSubmit={handleLogin}>
            {error && (
              <div
                style={{
                  background: 'var(--danger-soft)',
                  color: 'var(--danger)',
                  border: '1px solid rgba(240, 68, 56, 0.25)',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="field" style={{ marginBottom: '16px' }}>
              <label htmlFor="email">Alamat Email</label>
              <div className="input-icon-group">
                <svg className="input-icon-left" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <input
                  id="email"
                  type="email"
                  required
                  className="input-with-icon"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@domain.com"
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div className="field" style={{ marginBottom: '20px' }}>
              <label htmlFor="password">Kata Sandi</label>
              <div className="input-icon-group">
                <svg className="input-icon-left" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input-with-icon has-right"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="pass-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                  title={showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                >
                  {showPassword ? (
                    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary login-submit-btn"
              disabled={loading}
            >
              {loading ? 'Memverifikasi Akses...' : 'Masuk ke Dashboard'}
            </button>
          </form>

          <div className="login-security-note">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span>Koneksi terenkripsi • Sesi terlindungi HttpOnly</span>
          </div>
        </div>
      </section>
    </div>
  )
}