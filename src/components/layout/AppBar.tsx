'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import { usePogStore } from '@/store/pogStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/home', label: '馬選択' },
  { href: '/group', label: 'オーナー管理' },
  { href: '/download', label: 'CSVダウンロード' },
]

export default function AppBar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out failed:', error.message)
    }
    usePogStore.getState().clearData()
    router.refresh()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-10 border-b bg-background">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <nav className="flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                pathname === href || pathname.startsWith(href + '/')
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground',
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Button variant="ghost" size="sm" onClick={() => void handleLogout()}>
          ログアウト
        </Button>
      </div>
    </header>
  )
}
