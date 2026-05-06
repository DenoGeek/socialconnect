/**
 * WhatsApp Cloud API stub. Wire up in phase 2 (per the plan, SMS handles v1).
 * The interface mirrors sendSms() so call sites can switch with one line.
 */

export interface SendWhatsAppInput {
  to: string;
  templateName?: string;
  templateParams?: Record<string, string>;
  body?: string;
}

export interface SendWhatsAppResult {
  delivered: boolean;
}

export async function sendWhatsApp(input: SendWhatsAppInput): Promise<SendWhatsAppResult> {
  if (process.env.NODE_ENV !== "production") {
    console.info("[whatsapp:dev]", input.to, "→", input.body ?? input.templateName);
    return { delivered: false };
  }
  // TODO: implement WhatsApp Cloud API call once token is provisioned.
  throw new Error("WhatsApp provider is not yet configured");
}
