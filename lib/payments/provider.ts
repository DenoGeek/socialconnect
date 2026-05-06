/**
 * PaymentProvider — the seam between domain code and payment vendors.
 *
 * v1 has one implementation: TinyPesaProvider (KSH via M-Pesa STK Push).
 * Adding USD later means writing a StripeProvider that satisfies this interface;
 * domain code (ticket purchase, booking, subscription) does not change.
 */

export type Currency = "KES" | "USD";

export type PaymentPurpose =
  | "ticket"
  | "booking"
  | "subscription"
  | "appointment"
  | "program";

export interface InitiatePaymentInput {
  /** Stable key — same input → same providerRef. Use `${purpose}:${purposeRef}:${userId}`. */
  idempotencyKey: string;
  userId: string;
  amountMinor: number;
  currency: Currency;
  purpose: PaymentPurpose;
  /** Domain row this payment settles (e.g. ticketPurchase.id). */
  purposeRef: string;
  /** End-customer phone in international form (KE: 2547XXXXXXXX). Required for M-Pesa. */
  msisdn?: string;
  /** Free-form description shown on bank statement / receipt. */
  description?: string;
  /** URL the provider POSTs the callback to. Defaults to the app webhook. */
  callbackUrl?: string;
}

export interface InitiatePaymentResult {
  /** The opaque ID we wrote to payments.id */
  paymentId: string;
  /** What the provider returned — opaque token to poll/verify. */
  providerRef: string;
  /** "pending" while STK push is on the user's phone; "succeeded" only after webhook. */
  status: "pending" | "processing" | "succeeded" | "failed";
  /** Provider-specific raw blob, useful for debug. */
  raw?: Record<string, unknown>;
}

export interface VerifyPaymentResult {
  paymentId: string;
  status: "pending" | "processing" | "succeeded" | "failed" | "refunded";
  amountMinor: number;
  currency: Currency;
  providerRef: string;
}

export interface RefundInput {
  paymentId: string;
  /** Partial refund amount in minor units. Omit for full refund. */
  amountMinor?: number;
  reason?: string;
}

export interface WebhookContext {
  rawBody: string;
  headers: Record<string, string>;
}

export interface WebhookResult {
  paymentId?: string;
  status: "pending" | "processing" | "succeeded" | "failed" | "refunded";
  providerRef?: string;
  amountMinor?: number;
  raw: Record<string, unknown>;
}

export interface PaymentProvider {
  readonly name: "tinypesa" | "stripe" | "flutterwave" | "manual";
  readonly currency: Currency;
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  verify(paymentId: string): Promise<VerifyPaymentResult>;
  refund(input: RefundInput): Promise<VerifyPaymentResult>;
  /** Parse + verify a webhook signature. Returns a normalized result. */
  parseWebhook(ctx: WebhookContext): Promise<WebhookResult>;
}

export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public providerRef?: string,
  ) {
    super(message);
    this.name = "PaymentError";
  }
}
