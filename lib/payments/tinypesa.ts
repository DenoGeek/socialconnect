/**
 * TinyPesa adapter for M-Pesa STK Push (Kenya).
 * Docs: https://developers.tinypesa.com/
 *
 * Wire format details are confined to this file. If TinyPesa changes their
 * request/response shape, update the constants and `mapStatus` here only —
 * domain code talks to the PaymentProvider interface, not TinyPesa.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { payments } from "@/db/schema";
import {
  PaymentError,
  type InitiatePaymentInput,
  type InitiatePaymentResult,
  type PaymentProvider,
  type RefundInput,
  type VerifyPaymentResult,
  type WebhookContext,
  type WebhookResult,
} from "./provider";

const TINYPESA_BASE = process.env.TINYPESA_BASE_URL ?? "https://tinypesa.com/api/v1";

interface TinyPesaInitiateResponse {
  success?: boolean;
  request_id?: string;
  message?: string;
  ResponseDescription?: string;
  ResponseCode?: string;
}

interface TinyPesaCallbackBody {
  request_id?: string;
  Body?: {
    stkCallback?: {
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResultCode?: number;
      ResultDesc?: string;
      CallbackMetadata?: {
        Item?: Array<{ Name?: string; Value?: string | number }>;
      };
    };
  };
  amount?: number;
  msisdn?: string;
  status?: string;
}

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new PaymentError(`${key} is not set`, "config_missing");
  return v;
}

function mapStatus(resultCode: number | string | undefined): VerifyPaymentResult["status"] {
  if (resultCode === undefined || resultCode === null) return "pending";
  const code = typeof resultCode === "string" ? Number(resultCode) : resultCode;
  if (code === 0) return "succeeded";
  if (code === 1032) return "failed"; // user cancelled
  if (code === 1037) return "failed"; // timeout
  return "failed";
}

export class TinyPesaProvider implements PaymentProvider {
  readonly name = "tinypesa" as const;
  readonly currency = "KES" as const;

  private get apiKey() {
    return requireEnv("TINYPESA_API_KEY");
  }
  private get accountNo() {
    return requireEnv("TINYPESA_ACCOUNT_NO");
  }

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    if (input.currency !== "KES") {
      throw new PaymentError(`TinyPesa only supports KES, got ${input.currency}`, "currency_unsupported");
    }
    if (!input.msisdn) {
      throw new PaymentError("msisdn is required for M-Pesa STK Push", "msisdn_missing");
    }

    // Idempotency: check for an existing payment row with this key.
    const existing = await db
      .select()
      .from(payments)
      .where(eq(payments.idempotencyKey, input.idempotencyKey))
      .limit(1);
    if (existing.length > 0) {
      const p = existing[0];
      return {
        paymentId: p.id,
        providerRef: p.providerRef ?? "",
        status: p.status === "succeeded" ? "succeeded"
          : p.status === "failed" ? "failed"
          : p.status === "processing" ? "processing"
          : "pending",
        raw: (p.rawCallback as Record<string, unknown>) ?? undefined,
      };
    }

    const [inserted] = await db
      .insert(payments)
      .values({
        userId: input.userId,
        provider: "tinypesa",
        amountMinor: input.amountMinor,
        currency: "KES",
        status: "pending",
        idempotencyKey: input.idempotencyKey,
        purpose: input.purpose,
        purposeRef: input.purposeRef,
      })
      .returning();

    const body = new URLSearchParams({
      amount: String(Math.round(input.amountMinor)), // KES has no minor unit
      msisdn: input.msisdn,
      account_no: this.accountNo,
    });

    const res = await fetch(`${TINYPESA_BASE}/express/initialize`, {
      method: "POST",
      headers: {
        ApiKey: this.apiKey,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const json = (await res.json().catch(() => ({}))) as TinyPesaInitiateResponse;

    if (!res.ok || !json.success) {
      await db
        .update(payments)
        .set({
          status: "failed",
          failureReason: json.message ?? json.ResponseDescription ?? `HTTP ${res.status}`,
          rawCallback: json as never,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, inserted.id));
      throw new PaymentError(
        json.message ?? json.ResponseDescription ?? "TinyPesa initiate failed",
        "initiate_failed",
        json.request_id,
      );
    }

    const requestId = json.request_id ?? "";
    await db
      .update(payments)
      .set({
        providerRef: requestId,
        status: "processing",
        updatedAt: new Date(),
      })
      .where(eq(payments.id, inserted.id));

    return {
      paymentId: inserted.id,
      providerRef: requestId,
      status: "processing",
      raw: json as Record<string, unknown>,
    };
  }

  async verify(paymentId: string): Promise<VerifyPaymentResult> {
    const [row] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    if (!row) throw new PaymentError("payment not found", "not_found");
    // Collapse partial_refund → refunded for the public interface; the DB
    // retains the precise distinction for accounting.
    const status: VerifyPaymentResult["status"] =
      row.status === "partial_refund" ? "refunded" : row.status;
    return {
      paymentId: row.id,
      status,
      amountMinor: row.amountMinor,
      currency: row.currency as "KES",
      providerRef: row.providerRef ?? "",
    };
  }

  async refund(_input: RefundInput): Promise<VerifyPaymentResult> {
    // M-Pesa B2C reversal is a separate API call; not exposed on the TinyPesa
    // free tier. v1 marks refunded manually from the admin UI; full automation
    // ships in a later milestone.
    throw new PaymentError("Automated refunds are not yet supported on TinyPesa", "refund_unsupported");
  }

  async parseWebhook(ctx: WebhookContext): Promise<WebhookResult> {
    let parsed: TinyPesaCallbackBody;
    try {
      parsed = JSON.parse(ctx.rawBody);
    } catch {
      throw new PaymentError("invalid webhook body", "webhook_parse");
    }

    const stk = parsed.Body?.stkCallback;
    const requestId = parsed.request_id ?? stk?.CheckoutRequestID ?? stk?.MerchantRequestID;
    const status = mapStatus(stk?.ResultCode);

    const amountItem = stk?.CallbackMetadata?.Item?.find((i) => i.Name === "Amount");
    const amount = typeof amountItem?.Value === "number"
      ? amountItem.Value
      : amountItem?.Value
      ? Number(amountItem.Value)
      : undefined;

    return {
      providerRef: requestId,
      status,
      amountMinor: amount,
      raw: parsed as unknown as Record<string, unknown>,
    };
  }
}

export const tinypesa = new TinyPesaProvider();
