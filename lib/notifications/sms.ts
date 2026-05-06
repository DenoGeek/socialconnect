// Africa's Talking SMS adapter. Lazily-imported because the SDK pulls in
// crypto modules that fail to bundle on the Edge runtime.

export interface SendSmsInput {
  to: string | string[];
  message: string;
  from?: string;
}

export interface SendSmsResult {
  delivered: boolean;
  recipients: number;
  raw?: unknown;
}

export async function sendSms(input: SendSmsInput): Promise<SendSmsResult> {
  const apiKey = process.env.AT_API_KEY;
  const username = process.env.AT_USERNAME ?? "sandbox";
  const senderId = input.from ?? process.env.AT_SENDER_ID;

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[sms:dev]", input.to, "→", input.message);
      return { delivered: false, recipients: Array.isArray(input.to) ? input.to.length : 1 };
    }
    throw new Error("AT_API_KEY is not set");
  }

  const at = (await import("africastalking")).default({ apiKey, username });
  const result = await at.SMS.send({
    to: Array.isArray(input.to) ? input.to : [input.to],
    message: input.message,
    from: senderId,
  });
  return {
    delivered: true,
    recipients: Array.isArray(input.to) ? input.to.length : 1,
    raw: result,
  };
}
