export type PaymentProvider = "tinypesa" | "mpesa" | "card" | "cytton_mmf" | "manual";

export type StartPaymentInput = {
  userId: string;
  subjectKind:
    | "ticket"
    | "booking"
    | "trip"
    | "professional"
    | "subscription"
    | "zahari_sovereign"
    | "zahari_activation";
  subjectId: string;
  provider: PaymentProvider;
  currency: "KSH" | "USD";
  amount: number;
  phone?: string;
  senderDisplayName?: string;
};

export type PaymentRecord = {
  id: string;
  status: "pending" | "processing" | "succeeded" | "failed";
  providerRef?: string;
};
