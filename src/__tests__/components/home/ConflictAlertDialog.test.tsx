import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const { default: ConflictAlertDialog } = await import('@/components/home/ConflictAlertDialog')

describe('ConflictAlertDialog', () => {
  it('母馬名を含むエラーメッセージが表示される', () => {
    render(<ConflictAlertDialog open={true} onOpenChange={vi.fn()} mareName="アーモンドアイ" />)

    expect(
      screen.getByText(
        '母馬「アーモンドアイ」はすでに他の馬の母として指名されているので登録できません。',
      ),
    ).toBeInTheDocument()
  })

  it('OKボタンを押すとonOpenChange(false)が呼ばれる', () => {
    const onOpenChange = vi.fn()

    render(
      <ConflictAlertDialog open={true} onOpenChange={onOpenChange} mareName="アーモンドアイ" />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'OK' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('「続ける」ボタンが存在しない', () => {
    render(<ConflictAlertDialog open={true} onOpenChange={vi.fn()} mareName="アーモンドアイ" />)

    expect(screen.queryByRole('button', { name: '続ける' })).not.toBeInTheDocument()
  })

  it('「キャンセル」ボタンが存在しない', () => {
    render(<ConflictAlertDialog open={true} onOpenChange={vi.fn()} mareName="アーモンドアイ" />)

    expect(screen.queryByRole('button', { name: 'キャンセル' })).not.toBeInTheDocument()
  })
})
