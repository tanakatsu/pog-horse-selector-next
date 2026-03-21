export type Owner = {
  id: number
  user_id: string
  year: number
  name: string
  no: number | null
  created_at: string
}

export type Horse = {
  id: number
  user_id: string
  year: number
  horse_id: string | null
  name: string
  sire: string
  mare: string
  owner_id: number
  po_order_no: number
  created_at: string
}

export type CatalogHorse = {
  horse_id: string
  name: string
  sire: string
  mare: string
}
