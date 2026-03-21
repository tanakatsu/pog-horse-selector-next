import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import AppBar from '@/components/layout/AppBar'
import DataProvider from '@/components/layout/DataProvider'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <DataProvider>
      <AppBar />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </DataProvider>
  )
}
