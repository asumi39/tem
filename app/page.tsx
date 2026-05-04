import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto grid min-h-[70vh] max-w-5xl place-items-center px-6 py-16">
      <section className="rounded-[2.5rem] border border-[color:var(--tem-border)] bg-[color:var(--tem-paper)] p-8 shadow-[0_30px_100px_rgba(42,31,20,0.12)] sm:p-12">
        <p className="text-xs font-bold uppercase tracking-[0.34em] text-[color:var(--tem-vermilion)]">Writing-first practice</p>
        <h1 className="mt-4 text-5xl font-black tracking-[-0.06em] text-[color:var(--tem-ink)] sm:text-7xl">
          TEM-4 Practice
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[color:var(--tem-muted)]">
          Start a browser-based TEM-4 writing attempt, preserve the archived answer, and review the snapshot-backed result.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/exams"
            className="rounded-full bg-[color:var(--tem-ink)] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--tem-paper)] transition hover:bg-[color:var(--tem-vermilion)]"
          >
            Go to exams
          </Link>
          <Link
            href="/history"
            className="rounded-full border border-[color:var(--tem-border)] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--tem-ink)] transition hover:bg-[color:var(--tem-sand)]"
          >
            View history
          </Link>
        </div>
      </section>
    </main>
  );
}
