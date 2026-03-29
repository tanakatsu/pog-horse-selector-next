'use client'

import { FileDown } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { usePogStore } from '@/store/pogStore'
import CsvDownloadButton from '@/components/download/CsvDownloadButton'

export default function DownloadPage() {
  const horses = usePogStore(useShallow((state) => state.horses))
  const owners = usePogStore(useShallow((state) => state.owners))
  const loading = usePogStore((state) => state.loading)

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="font-serif text-2xl text-[var(--pog-green)] mb-6">データエクスポート</h1>

      {loading ? (
        <p className="text-muted-foreground" aria-live="polite" role="status">
          読み込み中…
        </p>
      ) : (
        <div className="rounded-2xl border border-[var(--pog-green)]/15 bg-white p-10 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[var(--pog-green)]/8 flex items-center justify-center mx-auto mb-5">
            <FileDown className="w-8 h-8 text-[var(--pog-green)]/60" />
          </div>
          <h2 className="font-semibold text-[var(--pog-green)] mb-1">登録済み馬データ</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {horses.length}頭 · {owners.length}オーナー · CSV形式
          </p>
          <CsvDownloadButton horses={horses} owners={owners} />
          <p className="text-xs text-muted-foreground/60 mt-4">
            BOM付きUTF-8形式。Excelで文字化けしません。
          </p>
        </div>
      )}
    </div>
  )
}
