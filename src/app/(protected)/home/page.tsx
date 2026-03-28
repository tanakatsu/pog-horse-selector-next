import rawCatalogue from '@/data/horse_catalogue.json'
import type { CatalogHorse } from '@/types'
import { getCatalogueYear } from '@/lib/utils'
import HomePageClient from './HomePageClient'

export default function HomePage() {
  const catalogueYear = String(getCatalogueYear())
  const catalogue = (rawCatalogue as CatalogHorse[]).filter((h) => h.id.startsWith(catalogueYear))

  return <HomePageClient catalogue={catalogue} />
}
