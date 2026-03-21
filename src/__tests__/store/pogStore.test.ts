import { beforeEach, describe, expect, it } from 'vitest'
import {
  ownerHorseCount,
  ownerHorseLastNo,
  ownerHorses,
  sortedOwners,
  usePogStore,
} from '@/store/pogStore'
import type { Horse, Owner } from '@/types'

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
    horse_id: 'horse-1',
    name: 'テスト馬',
    sire: '父馬',
    mare: '母馬',
    owner_id: 1,
    po_order_no: 1,
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

beforeEach(() => {
  usePogStore.setState({ owners: [], horses: [], loading: false, error: null })
})

describe('addOwner', () => {
  it('owners 配列にオーナーを追加する', () => {
    const owner = makeOwner({ id: 1, name: 'オーナーA' })
    usePogStore.getState().addOwner(owner)
    expect(usePogStore.getState().owners).toHaveLength(1)
    expect(usePogStore.getState().owners[0]).toEqual(owner)
  })
})

describe('removeOwner', () => {
  it('id でオーナーを削除する', () => {
    const owner1 = makeOwner({ id: 1, name: 'オーナーA' })
    const owner2 = makeOwner({ id: 2, name: 'オーナーB' })
    usePogStore.setState({ owners: [owner1, owner2] })
    usePogStore.getState().removeOwner(1)
    const owners = usePogStore.getState().owners
    expect(owners).toHaveLength(1)
    expect(owners[0]?.id).toBe(2)
  })
})

describe('addHorse', () => {
  it('horses 配列に馬を追加する', () => {
    const horse = makeHorse({ id: 1, name: 'テスト馬' })
    usePogStore.getState().addHorse(horse)
    expect(usePogStore.getState().horses).toHaveLength(1)
    expect(usePogStore.getState().horses[0]).toEqual(horse)
  })
})

describe('removeHorse', () => {
  it('id で馬を削除する', () => {
    const horse1 = makeHorse({ id: 1, name: '馬A' })
    const horse2 = makeHorse({ id: 2, name: '馬B' })
    usePogStore.setState({ horses: [horse1, horse2] })
    usePogStore.getState().removeHorse(1)
    const horses = usePogStore.getState().horses
    expect(horses).toHaveLength(1)
    expect(horses[0]?.id).toBe(2)
  })
})

describe('sortedOwners selector', () => {
  it('no の昇順でオーナーをソートする', () => {
    const owners = [
      makeOwner({ id: 1, name: 'A', no: 2 }),
      makeOwner({ id: 2, name: 'B', no: 1 }),
      makeOwner({ id: 3, name: 'C', no: 3 }),
    ]
    usePogStore.setState({ owners })
    const sorted = sortedOwners(usePogStore.getState())
    expect(sorted.map((o) => o.no)).toEqual([1, 2, 3])
  })

  it('no が null のオーナーは末尾に並ぶ', () => {
    const owners = [
      makeOwner({ id: 1, name: 'A', no: null }),
      makeOwner({ id: 2, name: 'B', no: 1 }),
      makeOwner({ id: 3, name: 'C', no: 2 }),
    ]
    usePogStore.setState({ owners })
    const sorted = sortedOwners(usePogStore.getState())
    expect(sorted[0]?.no).toBe(1)
    expect(sorted[1]?.no).toBe(2)
    expect(sorted[2]?.no).toBeNull()
  })
})

describe('ownerHorseCount selector', () => {
  it('オーナーAが3頭の馬を持つ場合 owner.id をキーとして { 1: 3 } を返す', () => {
    const owner = makeOwner({ id: 1, name: 'オーナーA' })
    const horses = [
      makeHorse({ id: 1, owner_id: 1, po_order_no: 1 }),
      makeHorse({ id: 2, owner_id: 1, po_order_no: 2 }),
      makeHorse({ id: 3, owner_id: 1, po_order_no: 3 }),
    ]
    usePogStore.setState({ owners: [owner], horses })
    const counts = ownerHorseCount(usePogStore.getState())
    expect(counts).toEqual({ 1: 3 })
  })
})

describe('ownerHorseLastNo selector', () => {
  it('オーナーAの最大 po_order_no が 3 の場合 owner.id をキーとして { 1: 3 } を返す', () => {
    const owner = makeOwner({ id: 1, name: 'オーナーA' })
    const horses = [
      makeHorse({ id: 1, owner_id: 1, po_order_no: 1 }),
      makeHorse({ id: 2, owner_id: 1, po_order_no: 3 }),
      makeHorse({ id: 3, owner_id: 1, po_order_no: 2 }),
    ]
    usePogStore.setState({ owners: [owner], horses })
    const lastNos = ownerHorseLastNo(usePogStore.getState())
    expect(lastNos).toEqual({ 1: 3 })
  })
})

describe('updateOwner', () => {
  it('一致する id のオーナーを置き換える', () => {
    const owner = makeOwner({ id: 1, name: 'オーナーA', no: 1 })
    usePogStore.setState({ owners: [owner] })
    const updated = makeOwner({ id: 1, name: '更新済みA', no: 2 })
    usePogStore.getState().updateOwner(updated)
    expect(usePogStore.getState().owners[0]).toEqual(updated)
  })

  it('存在しない id の場合は配列を変更しない', () => {
    const owner = makeOwner({ id: 1 })
    usePogStore.setState({ owners: [owner] })
    usePogStore.getState().updateOwner(makeOwner({ id: 99, name: '存在しない' }))
    expect(usePogStore.getState().owners).toHaveLength(1)
    expect(usePogStore.getState().owners[0]?.id).toBe(1)
  })
})

describe('updateHorse', () => {
  it('一致する id の馬を置き換える', () => {
    const horse = makeHorse({ id: 1, name: '馬A', po_order_no: 1 })
    usePogStore.setState({ horses: [horse] })
    const updated = makeHorse({ id: 1, name: '更新済み馬A', po_order_no: 2 })
    usePogStore.getState().updateHorse(updated)
    expect(usePogStore.getState().horses[0]).toEqual(updated)
  })

  it('存在しない id の場合は配列を変更しない', () => {
    const horse = makeHorse({ id: 1 })
    usePogStore.setState({ horses: [horse] })
    usePogStore.getState().updateHorse(makeHorse({ id: 99, name: '存在しない' }))
    expect(usePogStore.getState().horses).toHaveLength(1)
    expect(usePogStore.getState().horses[0]?.id).toBe(1)
  })
})

describe('addOwner (idempotent)', () => {
  it('同じ id のオーナーは重複して追加されない', () => {
    const owner = makeOwner({ id: 1 })
    usePogStore.getState().addOwner(owner)
    usePogStore.getState().addOwner(owner)
    expect(usePogStore.getState().owners).toHaveLength(1)
  })
})

describe('addHorse (idempotent)', () => {
  it('同じ id の馬は重複して追加されない', () => {
    const horse = makeHorse({ id: 1 })
    usePogStore.getState().addHorse(horse)
    usePogStore.getState().addHorse(horse)
    expect(usePogStore.getState().horses).toHaveLength(1)
  })
})

describe('ownerHorses selector', () => {
  it('オーナー名でグループ化された馬の一覧を返す', () => {
    const owner = makeOwner({ id: 1, name: 'オーナーA' })
    const horses = [
      makeHorse({ id: 1, owner_id: 1, name: '馬1', po_order_no: 1 }),
      makeHorse({ id: 2, owner_id: 1, name: '馬2', po_order_no: 2 }),
    ]
    usePogStore.setState({ owners: [owner], horses })
    const result = ownerHorses(usePogStore.getState())
    expect(result['オーナーA']).toHaveLength(2)
  })

  it('馬がいないオーナーはキーに含まれない', () => {
    const owner = makeOwner({ id: 1, name: 'オーナーA' })
    usePogStore.setState({ owners: [owner], horses: [] })
    const result = ownerHorses(usePogStore.getState())
    expect('オーナーA' in result).toBe(false)
  })

  it('owner_id が存在しないオーナーを指す馬は除外される', () => {
    const horse = makeHorse({ id: 1, owner_id: 999 })
    usePogStore.setState({ owners: [], horses: [horse] })
    const result = ownerHorses(usePogStore.getState())
    expect(Object.keys(result)).toHaveLength(0)
  })
})

describe('clearData', () => {
  it('owners と horses を空配列にリセットする', () => {
    usePogStore.setState({
      owners: [makeOwner()],
      horses: [makeHorse()],
    })
    usePogStore.getState().clearData()
    expect(usePogStore.getState().owners).toEqual([])
    expect(usePogStore.getState().horses).toEqual([])
  })

  it('loading を false にリセットする', () => {
    usePogStore.setState({ loading: true })
    usePogStore.getState().clearData()
    expect(usePogStore.getState().loading).toBe(false)
  })
})
