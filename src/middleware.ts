import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  // 認証不要のパス（ホワイトリスト）— それ以外は全て認証必須
  const publicPaths = ['/login', '/signup', '/forgot-password', '/auth/callback']
  // 認証済みユーザーを /home にリダイレクトするパス
  const authOnlyPaths = ['/login', '/signup', '/forgot-password']

  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))
  const isAuthOnly = authOnlyPaths.some((p) => pathname === p)

  if (!isPublic && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (isAuthOnly && user) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
