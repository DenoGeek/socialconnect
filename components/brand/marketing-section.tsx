import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";

export function MarketingHero({
  headline,
  sub,
  children,
}: {
  headline: string;
  sub: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="brand-bg">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <h1 className="text-display text-4xl md:text-6xl text-plum-100 max-w-3xl leading-tight">
          {headline}
        </h1>
        <p className="mt-6 max-w-xl text-plum-100/70 text-lg">{sub}</p>
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

export function StepGrid({
  steps,
}: {
  steps: { n: string; title: string; body: string }[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {steps.map((s) => (
        <Card key={s.n}>
          <p className="text-xs uppercase tracking-widest text-plum-900/50">
            {s.n}
          </p>
          <CardTitle className="mt-2 text-lg">{s.title}</CardTitle>
          <CardSubtitle className="mt-2">{s.body}</CardSubtitle>
        </Card>
      ))}
    </div>
  );
}
