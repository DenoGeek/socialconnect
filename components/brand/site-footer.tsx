import Link from "next/link";
import { AGANO } from "@/lib/copy/agano";

export function SiteFooter() {
  return (
    <footer className="border-t border-plum-900/8 bg-plum-900 text-plum-100">
      <div className="mx-auto max-w-6xl px-4 py-12 grid gap-8 md:grid-cols-3">
        <div>
          <p className="text-sm italic opacity-80">{AGANO.scripture}</p>
          <p className="mt-4 text-display text-xl">Agano Evermore</p>
          <p className="text-sm opacity-70 mt-1">{AGANO.tagline}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest opacity-60 mb-3">
            Navigation
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/" className="hover:underline">
                Home
              </Link>
            </li>
            <li>
              <Link href="/story" className="hover:underline">
                Our Story
              </Link>
            </li>
            <li>
              <Link href="/ecosystem" className="hover:underline">
                Our Ecosystem
              </Link>
            </li>
            <li>
              <Link href="/circles" className="hover:underline">
                Our Circles
              </Link>
            </li>
            <li>
              <Link href="/journey" className="hover:underline">
                Choose Your Journey
              </Link>
            </li>
            <li>
              <Link href="/resources" className="hover:underline">
                Resources
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest opacity-60 mb-3">
            Legal & trust
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/legal/terms" className="hover:underline">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/legal/privacy" className="hover:underline">
                Privacy Shield Policy
              </Link>
            </li>
            <li>
              <Link href="/legal/vetting" className="hover:underline">
                Vetting & Safety Standards
              </Link>
            </li>
            <li>
              <Link href="/legal/honor" className="hover:underline">
                Community Honor Code
              </Link>
            </li>
          </ul>
          <p className="mt-4 text-sm">
            <a href={`mailto:${AGANO.conciergeEmail}`} className="underline">
              {AGANO.conciergeEmail}
            </a>
          </p>
          <p className="text-xs opacity-60 mt-1">{AGANO.hub}</p>
        </div>
      </div>
      <p className="text-center text-xs opacity-50 pb-6">
        © {new Date().getFullYear()} Agano Evermore. All rights reserved.
      </p>
    </footer>
  );
}
