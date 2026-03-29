import BrandContent from './BrandContent'

export default function BrandPanel() {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center bg-[var(--pog-green)] relative overflow-hidden">
      <BrandContent />
    </div>
  )
}
