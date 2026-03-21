import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Horse, Owner } from '@/types'

const { default: CsvDownloadButton } = await import('@/components/download/CsvDownloadButton')

function makeOwner(overrides: Partial<Owner> = {}): Owner {
  return {
    id: 1,
    user_id: 'user-1',
    year: 2025,
    name: 'オーナーA',
    no: 1,
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeHorse(overrides: Partial<Horse> = {}): Horse {
  return {
    id: 1,
    user_id: 'user-1',
    year: 2025,
    horse_id: '2025000001',
    name: 'テスト馬',
    sire: 'テスト父',
    mare: 'テスト母',
    owner_id: 1,
    po_order_no: 1,
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

const mockOwners = [makeOwner()]

// Helper: mock only <a> element creation to avoid interfering with render()
function mockAnchorClick() {
  const click = vi.fn()
  const originalCreateElement = document.createElement.bind(document)
  const spy = vi.spyOn(document, 'createElement').mockImplementation((tag, options) => {
    if (tag === 'a') {
      return { href: '', download: '', click } as unknown as HTMLAnchorElement
    }
    return originalCreateElement(tag, options)
  })
  return { click, spy }
}

describe('CsvDownloadButton', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('馬が0件のときボタンが disabled', () => {
    render(<CsvDownloadButton horses={[]} owners={mockOwners} />)
    expect(screen.getByRole('button', { name: 'CSVダウンロード' })).toBeDisabled()
  })

  it('馬が1件以上のときボタンが有効', () => {
    render(<CsvDownloadButton horses={[makeHorse()]} owners={mockOwners} />)
    expect(screen.getByRole('button', { name: 'CSVダウンロード' })).not.toBeDisabled()
  })

  it('ボタンクリックでダウンロードが実行される', () => {
    vi.useFakeTimers()
    const { click } = mockAnchorClick()

    render(<CsvDownloadButton horses={[makeHorse()]} owners={mockOwners} />)
    fireEvent.click(screen.getByRole('button', { name: 'CSVダウンロード' }))

    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(click).toHaveBeenCalled()

    // revokeObjectURL は setTimeout 後に呼ばれる
    vi.runAllTimers()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    vi.useRealTimers()
  })

  it('CSVにBOM付きUTF-8ヘッダーが含まれる', async () => {
    let capturedBlob: Blob | null = null
    global.URL.createObjectURL = vi.fn((blob) => {
      capturedBlob = blob as Blob
      return 'blob:mock-url'
    })
    mockAnchorClick()

    render(<CsvDownloadButton horses={[makeHorse()]} owners={mockOwners} />)
    fireEvent.click(screen.getByRole('button', { name: 'CSVダウンロード' }))

    expect(capturedBlob).not.toBeNull()
    expect(capturedBlob!.type).toBe('text/csv;charset=utf-8;')
    // BOM(3 bytes) + 'order_no,...' の分だけ blob.size が増える
    // jsdom の TextDecoder は BOM をストリップするため arrayBuffer で確認
    const buf = await capturedBlob!.arrayBuffer()
    const bytes = new Uint8Array(buf)
    expect(bytes[0]).toBe(0xef) // UTF-8 BOM
    expect(bytes[1]).toBe(0xbb)
    expect(bytes[2]).toBe(0xbf)
    const text = await capturedBlob!.text()
    expect(text).toContain('order_no,owner_name,name,sire,mare,id')
  })
})

describe('CsvDownloadButton - CSVインジェクション対策', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('馬名に数式トリガー文字が含まれる場合はシングルクォートでエスケープされる', async () => {
    let capturedBlob: Blob | null = null
    global.URL.createObjectURL = vi.fn((blob) => {
      capturedBlob = blob as Blob
      return 'blob:mock-url'
    })
    global.URL.revokeObjectURL = vi.fn()
    mockAnchorClick()

    const horse = makeHorse({ name: '=MALICIOUS()' })
    render(<CsvDownloadButton horses={[horse]} owners={mockOwners} />)
    fireEvent.click(screen.getByRole('button', { name: 'CSVダウンロード' }))

    const text = await capturedBlob!.text()
    expect(text).toContain("'=MALICIOUS()")
    expect(text).not.toContain(',=MALICIOUS()')
  })

  it('フィールドにカンマが含まれる場合はダブルクォートで囲まれる', async () => {
    let capturedBlob: Blob | null = null
    global.URL.createObjectURL = vi.fn((blob) => {
      capturedBlob = blob as Blob
      return 'blob:mock-url'
    })
    global.URL.revokeObjectURL = vi.fn()
    mockAnchorClick()

    const owner = makeOwner({ name: 'Smith, Jr.' })
    const horse = makeHorse({ owner_id: 1 })
    render(<CsvDownloadButton horses={[horse]} owners={[owner]} />)
    fireEvent.click(screen.getByRole('button', { name: 'CSVダウンロード' }))

    const text = await capturedBlob!.text()
    expect(text).toContain('"Smith, Jr."')
  })
})

describe('CsvDownloadButton - ソート順', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('オーナー名 → po_order_no 昇順でCSV行が生成される', async () => {
    const owners = [
      makeOwner({ id: 1, name: 'Bオーナー' }),
      makeOwner({ id: 2, name: 'Aオーナー' }),
    ]
    const horses = [
      makeHorse({ id: 1, owner_id: 1, name: '馬B2', po_order_no: 2 }),
      makeHorse({ id: 2, owner_id: 1, name: '馬B1', po_order_no: 1 }),
      makeHorse({ id: 3, owner_id: 2, name: '馬A1', po_order_no: 1 }),
    ]

    let capturedBlob: Blob | null = null
    global.URL.createObjectURL = vi.fn((blob) => {
      capturedBlob = blob as Blob
      return 'blob:mock-url'
    })
    global.URL.revokeObjectURL = vi.fn()
    mockAnchorClick()

    render(<CsvDownloadButton horses={horses} owners={owners} />)
    fireEvent.click(screen.getByRole('button', { name: 'CSVダウンロード' }))

    expect(capturedBlob).not.toBeNull()
    const text = await capturedBlob!.text()
    const csvContent = text.replace('\uFEFF', '')
    const lines = csvContent.split('\n')

    expect(lines[0]).toBe('order_no,owner_name,name,sire,mare,id')
    // Aオーナーが先
    expect(lines[1]).toContain('Aオーナー')
    expect(lines[1]).toContain('馬A1')
    // Bオーナーの馬はpo_order_no順
    expect(lines[2]).toContain('Bオーナー')
    expect(lines[2]).toContain('馬B1')
    expect(lines[3]).toContain('Bオーナー')
    expect(lines[3]).toContain('馬B2')
  })
})
