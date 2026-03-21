import { create } from 'zustand'
import type { Horse, Owner } from '@/types'

type PogState = {
  owners: Owner[]
  horses: Horse[]
  loading: boolean
  error: string | null
}

type PogActions = {
  setOwners: (owners: Owner[]) => void
  setHorses: (horses: Horse[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  addOwner: (owner: Owner) => void
  removeOwner: (id: number) => void
  updateOwner: (owner: Owner) => void
  addHorse: (horse: Horse) => void
  removeHorse: (id: number) => void
  updateHorse: (horse: Horse) => void
  clearData: () => void
}

export type PogStore = PogState & PogActions

export const usePogStore = create<PogStore>((set) => ({
  owners: [],
  horses: [],
  loading: false,
  error: null,

  setOwners: (owners) => set({ owners }),
  setHorses: (horses) => set({ horses }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Idempotent: skip if owner with same id already exists (prevents Realtime duplicates)
  addOwner: (owner) =>
    set((state) => {
      if (state.owners.some((o) => o.id === owner.id)) return state
      return { owners: [...state.owners, owner] }
    }),
  removeOwner: (id) => set((state) => ({ owners: state.owners.filter((o) => o.id !== id) })),
  updateOwner: (owner) =>
    set((state) => ({
      owners: state.owners.map((o) => (o.id === owner.id ? owner : o)),
    })),

  // Idempotent: skip if horse with same id already exists (prevents Realtime duplicates)
  addHorse: (horse) =>
    set((state) => {
      if (state.horses.some((h) => h.id === horse.id)) return state
      return { horses: [...state.horses, horse] }
    }),
  removeHorse: (id) => set((state) => ({ horses: state.horses.filter((h) => h.id !== id) })),
  updateHorse: (horse) =>
    set((state) => ({
      horses: state.horses.map((h) => (h.id === horse.id ? horse : h)),
    })),

  clearData: () => set({ owners: [], horses: [], loading: false, error: null }),
}))

// Selectors

export function sortedOwners(state: PogStore): Owner[] {
  return [...state.owners].sort((a, b) => {
    if (a.no === null && b.no === null) return 0
    if (a.no === null) return 1
    if (b.no === null) return -1
    return a.no - b.no
  })
}

export function ownerHorseCount(state: PogStore): Record<string, number> {
  const ownerMap = new Map<number, string>()
  for (const owner of state.owners) {
    ownerMap.set(owner.id, owner.name)
  }

  const result: Record<string, number> = {}
  for (const horse of state.horses) {
    const ownerName = ownerMap.get(horse.owner_id)
    if (ownerName === undefined) continue
    result[ownerName] = (result[ownerName] ?? 0) + 1
  }
  return result
}

export function ownerHorseLastNo(state: PogStore): Record<string, number> {
  const ownerMap = new Map<number, string>()
  for (const owner of state.owners) {
    ownerMap.set(owner.id, owner.name)
  }

  const result: Record<string, number> = {}
  for (const horse of state.horses) {
    const ownerName = ownerMap.get(horse.owner_id)
    if (ownerName === undefined) continue
    const current = result[ownerName]
    if (current === undefined || horse.po_order_no > current) {
      result[ownerName] = horse.po_order_no
    }
  }
  return result
}

export function ownerHorses(state: PogStore): Record<string, Horse[]> {
  const ownerMap = new Map<number, string>()
  for (const owner of state.owners) {
    ownerMap.set(owner.id, owner.name)
  }

  const result: Record<string, Horse[]> = {}
  for (const horse of state.horses) {
    const ownerName = ownerMap.get(horse.owner_id)
    if (ownerName === undefined) continue
    if (result[ownerName] === undefined) {
      result[ownerName] = []
    }
    result[ownerName]!.push(horse)
  }
  return result
}
