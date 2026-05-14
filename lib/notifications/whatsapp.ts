// Stub. In production this hits the WhatsApp Business API via Twilio or Africa's
// Talking. For now we just log so the rest of the flow can be tested end-to-end.
export async function sendWhatsApp(opts: { to: string; body: string }) {
  // eslint-disable-next-line no-console
  console.log("[whatsapp][dev]", opts.to, opts.body);
  return { ok: true, sandbox: true };
}
