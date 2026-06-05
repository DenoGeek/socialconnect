import { MarketingHero } from "@/components/brand/marketing-section";

export default function TermsPage() {
  return (
    <>
      <MarketingHero headline="Terms of Service" sub="Agano Evermore Sync" />
      <article className="mx-auto max-w-3xl px-4 py-12 text-sm text-plum-900/80 space-y-4">
        <p>
          By using Agano Evermore Sync you agree to participate in a closed,
          faith-aligned community governed by our Community Honor Code and
          Vetting Standards.
        </p>
        <p>
          Membership is revocable for conduct that compromises safety, privacy,
          or the marriage-minded culture of the ecosystem.
        </p>
        <p>Contact: concierge@aganoevermore.com for full legal documents.</p>
      </article>
    </>
  );
}
