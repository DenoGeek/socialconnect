const FALLBACK_KES_PER_USD = 130;
const CACHE_TTL_MS = 60 * 60 * 1000;

let cachedRate: { kesPerUsd: number; fetchedAt: number } | null = null;

export type ExchangeRateInfo = {
  kesPerUsd: number;
  source: "api" | "fallback";
  fetchedAt: Date;
};

export async function getKesPerUsd(forceRefresh = false): Promise<ExchangeRateInfo> {
  const now = Date.now();
  if (
    !forceRefresh &&
    cachedRate &&
    now - cachedRate.fetchedAt < CACHE_TTL_MS
  ) {
    return {
      kesPerUsd: cachedRate.kesPerUsd,
      source: "api",
      fetchedAt: new Date(cachedRate.fetchedAt),
    };
  }

  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch(
        `https://v6.exchangerate-api.com/v6/${apiKey}/pair/USD/KES`,
        { next: { revalidate: 3600 } },
      );
      if (res.ok) {
        const data = (await res.json()) as { conversion_rate?: number };
        const rate = data.conversion_rate;
        if (rate && rate > 0) {
          cachedRate = { kesPerUsd: rate, fetchedAt: now };
          return { kesPerUsd: rate, source: "api", fetchedAt: new Date(now) };
        }
      }
    } catch {
      // fall through to fallback
    }
  }

  cachedRate = { kesPerUsd: FALLBACK_KES_PER_USD, fetchedAt: now };
  return {
    kesPerUsd: FALLBACK_KES_PER_USD,
    source: "fallback",
    fetchedAt: new Date(now),
  };
}
