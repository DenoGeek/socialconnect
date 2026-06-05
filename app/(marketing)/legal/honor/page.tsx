import { MarketingHero } from "@/components/brand/marketing-section";

export default function HonorPage() {
  return (
    <>
      <MarketingHero headline="Community Honor Code" sub="Stewards of holy covenants." />
      <article className="mx-auto max-w-3xl px-4 py-12 text-sm text-plum-900/80 space-y-4">
        <p>
          Members commit to honesty, discretion, and respect for boundaries at
          every stage — from first alias to covenant.
        </p>
        <p>
          Harassment, misrepresentation, or pressure tactics result in immediate
          removal and permanent exclusion from future matching.
        </p>
      </article>
    </>
  );
}
