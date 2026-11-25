'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function VerifyPage() {
  const params = useParams()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch(`/api/verify/${params.slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const json = await res.json()
    if (!res.ok) return setError(json.error || 'Password salah')
    window.location.href = json.destination_url
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="card max-w-sm w-full">
        <div className="card-body">
          <h1 className="card-title mb-4">Link Terlindungi</h1>
          <p className="page-sub mb-4">Masukkan password untuk melanjutkan.</p>
          <input
            type="password" required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full mb-3"
          />
          {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
          <button type="submit" className="btn btn-primary w-full">Buka Link</button>
        </div>
      </form>
    </div>
  )
}