import { MarketingHero } from "@/components/brand/marketing-section";

export default function PrivacyPage() {
  return (
    <>
      <MarketingHero headline="Privacy Shield Policy" sub="Your peace is protected by design." />
      <article className="mx-auto max-w-3xl px-4 py-12 text-sm text-plum-900/80 space-y-4">
        <p>
          Personal contact details, photos, and professional status remain
          guarded until you and a match mutually choose to proceed.
        </p>
        <p>
          Community Aliases are used at events. Zahari members remain invisible
          in public event directories.
        </p>
      </article>
    </>
  );
}
