import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <>{children}</>
}
