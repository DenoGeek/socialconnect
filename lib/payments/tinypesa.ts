import { normalizePhone } from "@/lib/utils/phone";

const BASE = process.env.TINYPESA_BASE_URL ?? "https://tinypesa.com/api/v1";
const KEY = process.env.TINYPESA_API_KEY;
const ACCOUNT = process.env.TINYPESA_ACCOUNT_NO;

export async function tinypesaStkPush(opts: {
  amount: number;
  phone: string;
  externalRef: string;
  displayName?: string;
}) {
  if (!KEY) {
    // No-op in dev — still returns a fake ref so the UI can proceed.
    return {
      ok: true,
      providerRef: `dev_${Date.now()}`,
      sandbox: true,
    };
  }

  const phone = normalizePhone(opts.phone, "KE").replace("+", "");
  const body = new URLSearchParams({
    amount: String(opts.amount),
    msisdn: phone,
    account_no: ACCOUNT ?? opts.externalRef,
  });

  const res = await fetch(`${BASE}/express/initialize`, {
    method: "POST",
    headers: {
      Apikey: KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return {
    ok: res.ok,
    providerRef: (json.request_id as string) ?? null,
    raw: json,
  };
}
