'use client'

import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { usePogStore } from '@/store/pogStore'
import type { Horse } from '@/types'
import HorseTable from '@/components/horselist/HorseTable'
import HorseEditDialog from '@/components/horselist/HorseEditDialog'
import HorseDeleteDialog from '@/components/horselist/HorseDeleteDialog'

type Props = {
  ownerName: string
}

export default function HorseListClient({ ownerName }: Props) {
  const horses = usePogStore(
    useShallow((state) => {
      const owner = state.owners.find((o) => o.name === ownerName)
      if (!owner) return []
      return state.horses.filter((h) => h.owner_id === owner.id)
    }),
  )
  const totalHorseCount = usePogStore((state) => state.horses.length)

  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Horse | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Horse | null>(null)

  const handleEdit = (horse: Horse) => {
    setEditTarget(horse)
    setEditOpen(true)
  }

  const handleDelete = (horse: Horse) => {
    setDeleteTarget(horse)
    setDeleteOpen(true)
  }

  const handleEditOpenChange = (open: boolean) => {
    setEditOpen(open)
    if (!open) setEditTarget(null)
  }

  const handleDeleteOpenChange = (open: boolean) => {
    setDeleteOpen(open)
    if (!open) setDeleteTarget(null)
  }

  return (
    <>
      <HorseTable
        horses={horses}
        totalHorseCount={totalHorseCount}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <HorseEditDialog open={editOpen} onOpenChange={handleEditOpenChange} target={editTarget} />
      <HorseDeleteDialog
        open={deleteOpen}
        onOpenChange={handleDeleteOpenChange}
        target={deleteTarget}
      />
    </>
  )
}
