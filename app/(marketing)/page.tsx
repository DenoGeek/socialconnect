import Link from "next/link";

const PILLARS = [
  { title: "Discovery", caption: "Curated retreats and the alias engine that keeps mystery alive.", path: "Evermore" },
  { title: "Match Loop", caption: "Impression cards, mutual matches, concierge-mediated handoffs.", path: "Match" },
  { title: "Concierge", caption: "Silent matching for those who prefer to stay private.", path: "Elite" },
  { title: "Lab", caption: "Premarital, marital and parental programs from vetted facilitators.", path: "Programs" },
  { title: "Residential", caption: "Modern-rustic stays and trip packages, hand-picked.", path: "Agano" },
] as const;

export default function HomePage() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <section className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-24">
        <header className="flex flex-col gap-4">
          <span className="text-xs uppercase tracking-[0.2em] text-stone-500">Evermore · Agano</span>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            A relationship nervous system — from first encounter to lasting covenant.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-stone-600">
            One ecosystem for discovery, matching, residential retreats, and the programs that
            help couples grow. Built quietly in Nairobi.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/events"
              className="inline-flex h-11 items-center rounded-full bg-stone-900 px-6 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-700"
            >
              Browse upcoming events
            </Link>
            <Link
              href="/concierge"
              className="inline-flex h-11 items-center rounded-full border border-stone-300 bg-white px-6 text-sm font-medium text-stone-900 transition-colors hover:border-stone-500"
            >
              Speak to concierge
            </Link>
          </div>
        </header>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((pillar) => (
            <article
              key={pillar.title}
              className="rounded-2xl border border-stone-200 bg-white p-6 transition-colors hover:border-stone-400"
            >
              <span className="text-[11px] uppercase tracking-[0.2em] text-stone-400">{pillar.path}</span>
              <h2 className="mt-3 text-xl font-medium">{pillar.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{pillar.caption}</p>
            </article>
          ))}
        </section>

        <footer className="mt-12 border-t border-stone-200 pt-6 text-xs text-stone-500">
          v0 · scaffolded · Nairobi · KES via M-Pesa
        </footer>
      </section>
    </main>
  );
}
