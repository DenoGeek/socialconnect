import { MarketingHero } from "@/components/brand/marketing-section";

export default function VettingPage() {
  return (
    <>
      <MarketingHero
        headline="Vetting & Safety Standards"
        sub="Every member is reviewed before entering the ecosystem."
      />
      <article className="mx-auto max-w-3xl px-4 py-12 text-sm text-plum-900/80 space-y-4">
        <p>
          Applications are reviewed by our concierge team. We verify age
          eligibility (27–60), alignment with community intent, and pathway fit
          (Amari or Zahari).
        </p>
        <p>
          Zahari engagements may include additional background verification
          coordinated by your matchmaker.
        </p>
      </article>
    </>
  );
}
