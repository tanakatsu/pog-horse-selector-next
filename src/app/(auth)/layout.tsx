export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" className="flex min-h-full items-center justify-center px-4">
      {children}
    </main>
  )
}
