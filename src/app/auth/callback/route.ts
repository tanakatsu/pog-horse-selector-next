import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

const ALLOWED_REDIRECT_PATHS = ['/home', '/reset-password']

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/home'
  const sanitizedNext = ALLOWED_REDIRECT_PATHS.includes(next) ? next : '/home'

  if (code) {
    const supabase = await getSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${sanitizedNext}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
