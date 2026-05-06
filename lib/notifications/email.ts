import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.RESEND_FROM ?? "Evermore <hello@evermore.co.ke>";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  id: string;
  delivered: boolean;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!resend) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[email:dev]", input.subject, "→", input.to);
      return { id: "dev-noop", delivered: false };
    }
    throw new Error("RESEND_API_KEY is not set");
  }
  const r = await resend.emails.send({
    from: FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo,
  });
  if (r.error) throw new Error(r.error.message);
  return { id: r.data?.id ?? "unknown", delivered: true };
}
