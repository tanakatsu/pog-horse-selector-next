type Props = {
  children?: React.ReactNode
}

export default function BrandContent({ children }: Props) {
  return (
    <>
      <div
        aria-hidden="true"
        role="presentation"
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #C8A84B 0, #C8A84B 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px',
        }}
      />
      <div className="relative flex flex-col items-center text-center">
        <p className="text-[var(--pog-gold)] font-serif text-6xl font-bold tracking-widest">POG</p>
        <p className="text-[var(--pog-gold)]/80 text-xl font-semibold tracking-[0.25em] mt-2 uppercase">
          Horse Selector
        </p>
        {children}
      </div>
    </>
  )
}
