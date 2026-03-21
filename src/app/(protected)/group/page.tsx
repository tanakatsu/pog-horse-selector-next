'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { Owner } from '@/types'
import { Button } from '@/components/ui/button'
import OwnerTable from '@/components/group/OwnerTable'
import OwnerFormDialog from '@/components/group/OwnerFormDialog'
import OwnerDeleteDialog from '@/components/group/OwnerDeleteDialog'

export default function GroupPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Owner | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Owner | null>(null)

  const handleEdit = (owner: Owner) => {
    setEditTarget(owner)
    setFormOpen(true)
  }

  const handleDelete = (owner: Owner) => {
    setDeleteTarget(owner)
    setDeleteOpen(true)
  }

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open)
    if (!open) setEditTarget(null)
  }

  const handleDeleteOpenChange = (open: boolean) => {
    setDeleteOpen(open)
    if (!open) setDeleteTarget(null)
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">オーナー管理</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus />
          オーナーを追加
        </Button>
      </div>
      <OwnerTable onEdit={handleEdit} onDelete={handleDelete} />
      <OwnerFormDialog
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        editTarget={editTarget}
      />
      <OwnerDeleteDialog
        open={deleteOpen}
        onOpenChange={handleDeleteOpenChange}
        target={deleteTarget}
      />
    </div>
  )
}
