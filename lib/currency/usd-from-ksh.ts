import { getKesPerUsd } from "./convert";

const USD_PROCESSING_FEE = 1;

/** KSH primary → USD with silent $1 processing fee baked in. */
export async function usdFromKsh(priceKsh: number): Promise<{
  priceUsd: number;
  kesPerUsd: number;
  rateSource: "api" | "fallback";
}> {
  const { kesPerUsd, source } = await getKesPerUsd();
  const baseUsd = priceKsh / kesPerUsd;
  const priceUsd = Math.round((baseUsd + USD_PROCESSING_FEE) * 100) / 100;
  return { priceUsd, kesPerUsd, rateSource: source };
}

/** Client-side preview using a known rate (no fee logic duplication). */
export function previewUsdFromKsh(
  priceKsh: number,
  kesPerUsd: number,
): number {
  const baseUsd = priceKsh / kesPerUsd;
  return Math.round((baseUsd + USD_PROCESSING_FEE) * 100) / 100;
}
