'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="container mx-auto p-6 max-w-2xl text-center">
      <h2 className="font-serif text-xl text-[var(--pog-green)] mb-4">
        データの読み込みに失敗しました
      </h2>
      <p className="text-sm text-muted-foreground mb-6">しばらくしてから再試行してください。</p>
      <Button onClick={reset} variant="outline">
        再試行
      </Button>
    </div>
  )
}
