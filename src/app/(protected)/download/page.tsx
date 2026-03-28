'use client'

import { useShallow } from 'zustand/react/shallow'
import { usePogStore } from '@/store/pogStore'
import CsvDownloadButton from '@/components/download/CsvDownloadButton'

export default function DownloadPage() {
  const horses = usePogStore(useShallow((state) => state.horses))
  const owners = usePogStore(useShallow((state) => state.owners))
  const loading = usePogStore((state) => state.loading)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">CSVダウンロード</h1>
      <p className="text-muted-foreground">
        登録済みの馬データをCSV形式でダウンロードします（BOM付きUTF-8）。
      </p>
      {loading ? (
        <p className="text-muted-foreground" aria-live="polite">
          読み込み中…
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">合計 {horses.length} 頭</p>
          <CsvDownloadButton horses={horses} owners={owners} />
        </>
      )}
    </div>
  )
}
