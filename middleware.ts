import { NextRequest, NextResponse } from 'next/server'
import { ratelimit } from '@/lib/rate-limit'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('gealink_token')?.value

  // 1. Rate limiting khusus untuk semua rute /api/*
  if (pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'anonymous'
    const { success, limit, remaining, reset } = await ratelimit.limit(ip)

    if (!success) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan. Coba lagi nanti.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) },
        }
      )
    }

    // Lindungi API pengelolaan link (/api/links)
    if (pathname.startsWith('/api/links') && !token) {
      return NextResponse.json(
        { error: 'Akses ditolak. Silakan login terlebih dahulu.' },
        { status: 401 }
      )
    }

    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', String(limit))
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    return response
  }

  // 2. Jika sudah login dan membuka /login, arahkan ke dashboard (/)
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 3. Lindungi halaman utama Dashboard (/)
  if (pathname === '/' && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/login', '/api/:path*'],
}