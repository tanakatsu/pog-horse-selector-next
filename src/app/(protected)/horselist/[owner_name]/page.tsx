import { notFound } from 'next/navigation'
import HorseListClient from '@/components/horselist/HorseListClient'

type Props = {
  params: Promise<{ owner_name: string }>
}

export default async function HorseListPage({ params }: Props) {
  const { owner_name } = await params
  let ownerName: string
  try {
    ownerName = decodeURIComponent(owner_name)
  } catch {
    notFound()
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">{ownerName} の馬リスト</h1>
      <HorseListClient ownerName={ownerName} />
    </div>
  )
}
