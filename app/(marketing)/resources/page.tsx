import Link from "next/link";
import { AGANO } from "@/lib/copy/agano";
import { MarketingHero } from "@/components/brand/marketing-section";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";

export default function ResourcesPage() {
  return (
    <>
      <MarketingHero
        headline="Wisdom for the Journey."
        sub="Cultivating clarity, discretion, and the sacred three-fold cord."
      />
      <section className="mx-auto max-w-3xl px-4 py-16 space-y-6">
        <Card>
          <CardTitle>Core FAQs</CardTitle>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="font-medium text-plum-900">Who is this for?</dt>
              <dd className="text-plum-900/70 mt-1">
                Intentional Christian singles aged 27–60 seeking God-grounded
                marriage.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-plum-900">Is my profile public?</dt>
              <dd className="text-plum-900/70 mt-1">
                No. You interact under a Community Alias until a mutual match.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-plum-900">
                How do I join Zahari?
              </dt>
              <dd className="text-plum-900/70 mt-1">
                Submit an application; our concierge reviews and contacts you.
              </dd>
            </div>
          </dl>
        </Card>
        <Card>
          <CardTitle>Reach the Concierge</CardTitle>
          <CardSubtitle className="mt-2">
            <a
              href={`mailto:${AGANO.conciergeEmail}`}
              className="underline text-plum-900"
            >
              {AGANO.conciergeEmail}
            </a>{" "}
            · {AGANO.hub}
          </CardSubtitle>
        </Card>
        <p className="text-sm">
          <Link href="/professionals" className="underline">
            Professionals directory
          </Link>{" "}
          (members) ·{" "}
          <Link href="/programs" className="underline">
            Agano programs
          </Link>
        </p>
      </section>
    </>
  );
}
