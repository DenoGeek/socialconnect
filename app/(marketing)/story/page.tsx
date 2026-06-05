import Link from "next/link";
import { AGANO } from "@/lib/copy/agano";
import { MarketingHero } from "@/components/brand/marketing-section";
import { Button } from "@/components/ui/button";

export default function StoryPage() {
  return (
    <>
      <MarketingHero
        headline="Built Out of Necessity. Stewarded by Faith."
        sub="We built this sanctuary because we needed it ourselves."
      />
      <section className="mx-auto max-w-3xl px-4 py-16 prose prose-plum">
        <p className="text-sm italic text-plum-900/70">{AGANO.scripture}</p>
        <p className="text-plum-900/80 leading-relaxed mt-6">
          We are not detached founders building another matching app. We walked
          the same modern dating jungle — superficial pools, compromised values,
          dead-end digital threads. Agano Evermore Sync is our response: a
          guarded path to lasting covenant, not just a beautiful wedding day.
        </p>
        <p className="text-plum-900/80 leading-relaxed mt-4">
          We are stewards of a space God can use to align steps, heal hearts, and
          connect His sons and daughters — walking with you to forge an unbreakable
          covenant and an Evermore legacy.
        </p>
        <Link href="/journey">
          <Button className="mt-8">Choose your journey</Button>
        </Link>
      </section>
    </>
  );
}
