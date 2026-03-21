'use client'

import { Button } from '@/components/ui/button'
import { getTargetYear } from '@/lib/utils'
import type { Horse, Owner } from '@/types'

type Props = {
  horses: Horse[]
  owners: Owner[]
}

// RFC 4180 準拠 + スプレッドシートのフォーミュラインジェクション対策
function escapeCsvField(value: string | number): string {
  const str = String(value)
  // 先頭が数式トリガー文字の場合はシングルクォートでエスケープ
  const sanitized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str
  // カンマ・ダブルクォート・改行を含む場合はダブルクォートで囲む
  if (/[",\n\r]/.test(sanitized)) {
    return `"${sanitized.replace(/"/g, '""')}"`
  }
  return sanitized
}

export default function CsvDownloadButton({ horses, owners }: Props) {
  const disabled = horses.length === 0

  const handleDownload = () => {
    const ownerMap = new Map<number, string>()
    for (const owner of owners) {
      ownerMap.set(owner.id, owner.name)
    }

    const sorted = [...horses].sort((a, b) => {
      const nameA = ownerMap.get(a.owner_id) ?? ''
      const nameB = ownerMap.get(b.owner_id) ?? ''
      if (nameA < nameB) return -1
      if (nameA > nameB) return 1
      return a.po_order_no - b.po_order_no
    })

    const rows = sorted.map((h) => {
      const ownerName = ownerMap.get(h.owner_id) ?? ''
      return [
        escapeCsvField(h.po_order_no),
        escapeCsvField(ownerName),
        escapeCsvField(h.name),
        escapeCsvField(h.sire),
        escapeCsvField(h.mare),
        escapeCsvField(h.horse_id ?? ''),
      ].join(',')
    })

    const bom = '\uFEFF'
    const csv = bom + 'order_no,owner_name,name,sire,mare,id\n' + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `pog_horses_${getTargetYear()}.csv`
    a.click()
    // ダウンロード完了後に解放（即時解放するとブラウザが読み込む前に解放される場合がある）
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  return (
    <Button onClick={handleDownload} disabled={disabled}>
      CSVダウンロード
    </Button>
  )
}
