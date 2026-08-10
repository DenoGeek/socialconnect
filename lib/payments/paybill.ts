/** Manual M-Pesa paybill instructions until USD checkout is available. */
export const AGANO_PAYBILL = {
  paybill: "775093",
  accountNumber: "57736013",
  accountName: "Agano Evermore",
} as const;

export const PAYMENT_METHODS = [
  {
    id: "tinypesa" as const,
    label: "TinyPesa (M-Pesa STK)",
    description: "Pay from your phone via an M-Pesa prompt.",
  },
  {
    id: "paybill" as const,
    label: "M-Pesa Paybill",
    description: `Paybill ${AGANO_PAYBILL.paybill} · Account ${AGANO_PAYBILL.accountNumber}`,
  },
] as const;
