import Link from "next/link";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[color:var(--tem-bg)] text-[color:var(--tem-ink)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-5 py-5 sm:px-8">
        <nav className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-full border border-[color:var(--tem-border)] bg-[color:var(--tem-paper)]/80 px-5 py-3 shadow-[0_18px_60px_rgba(42,31,20,0.06)] backdrop-blur">
          <Link href="/exams" className="font-black tracking-[-0.04em] text-[color:var(--tem-ink)]">
            TEM-4 Practice Ledger
          </Link>
          <div className="flex gap-2 text-sm font-bold text-[color:var(--tem-muted)]">
            <Link className="rounded-full px-4 py-2 transition hover:bg-[color:var(--tem-sand)] hover:text-[color:var(--tem-ink)]" href="/exams">
              Exams
            </Link>
            <Link className="rounded-full px-4 py-2 transition hover:bg-[color:var(--tem-sand)] hover:text-[color:var(--tem-ink)]" href="/history">
              History
            </Link>
          </div>
        </nav>
        {children}
      </div>
    </main>
  );
}
