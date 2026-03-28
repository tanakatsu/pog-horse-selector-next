import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getTargetYear } from '@/lib/utils'
import AppBar from '@/components/layout/AppBar'
import DataProvider from '@/components/layout/DataProvider'
import type { Horse, Owner } from '@/types'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const year = getTargetYear()

  const [ownersResult, horsesResult] = await Promise.all([
    supabase
      .from('owners')
      .select('*')
      .eq('year', year)
      .order('no', { ascending: true, nullsFirst: false }),
    supabase.from('horses').select('*').eq('year', year).order('po_order_no', { ascending: true }),
  ])

  if (ownersResult.error) throw ownersResult.error
  if (horsesResult.error) throw horsesResult.error

  const initialOwners = (ownersResult.data ?? []) as Owner[]
  const initialHorses = (horsesResult.data ?? []) as Horse[]

  return (
    <DataProvider initialOwners={initialOwners} initialHorses={initialHorses}>
      <AppBar />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </DataProvider>
  )
}
