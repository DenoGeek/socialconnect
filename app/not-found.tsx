import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center brand-bg">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-plum-100/70 mb-3">
          404
        </p>
        <h1 className="text-display text-4xl mb-3">A page off the map.</h1>
        <p className="text-plum-100/70 mb-8">
          The path you were on isn&rsquo;t in the ecosystem yet.
        </p>
        <Link href="/">
          <Button variant="elite">Return home</Button>
        </Link>
      </div>
    </main>
  );
}
