export default function HomeLoading() {
  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="h-8 w-24 bg-muted rounded animate-pulse mb-6" />
      <div className="h-10 w-full bg-muted rounded-md animate-pulse mb-6" />
      <ul className="space-y-2" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <li
            key={i}
            className="rounded-xl border border-[var(--pog-green)]/10 bg-white px-4 py-3.5 flex items-center gap-3"
          >
            <div className="w-7 h-7 rounded-full bg-muted flex-shrink-0" />
            <div className="h-4 bg-muted rounded flex-1" />
            <div className="h-4 w-10 bg-muted rounded" />
            <div className="w-4 h-4 bg-muted rounded flex-shrink-0" />
          </li>
        ))}
      </ul>
      <span className="sr-only" role="status">
        読み込み中…
      </span>
    </div>
  )
}
