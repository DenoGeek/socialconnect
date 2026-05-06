import { tinypesa } from "./tinypesa";
import type { PaymentProvider } from "./provider";

/**
 * Picks the right provider for a currency. v1 supports KES only.
 * When a Stripe adapter is added for USD, route here.
 */
export function paymentProviderFor(currency: "KES" | "USD"): PaymentProvider {
  if (currency === "KES") return tinypesa;
  throw new Error(`No payment provider configured for ${currency}`);
}

export * from "./provider";
