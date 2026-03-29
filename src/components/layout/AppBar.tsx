'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import { usePogStore } from '@/store/pogStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { APP_TITLE } from '@/lib/constants'

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
    <header className="sticky top-0 z-10 bg-[var(--pog-green)] shadow-md pt-[env(safe-area-inset-top)]">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link
            href="/home"
            className="text-sm font-semibold tracking-widest text-[var(--pog-gold)] uppercase hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded"
          >
            {APP_TITLE}
          </Link>
          <nav className="flex items-center gap-1" aria-label="メインナビゲーション">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-3 py-4 text-sm font-medium transition-colors border-b-2',
                  'text-white/70 hover:text-white border-transparent hover:border-white/30',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pog-green)] focus-visible:rounded',
                  (pathname === href || pathname.startsWith(href + '/')) &&
                    'text-[var(--pog-gold)] border-[var(--pog-gold)]',
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-[var(--pog-gold)] text-[var(--pog-gold)] hover:bg-[var(--pog-gold)]/15 hover:text-[var(--pog-gold)] focus-visible:ring-[var(--pog-gold)] focus-visible:ring-offset-[var(--pog-green)]"
          onClick={() => void handleLogout()}
        >
          ログアウト
        </Button>
      </div>
    </header>
  )
}
