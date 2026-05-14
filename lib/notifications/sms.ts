import AfricasTalking from "africastalking";

const KEY = process.env.AT_API_KEY;
const USERNAME = process.env.AT_USERNAME ?? "sandbox";
const SENDER = process.env.AT_SENDER_ID;

let client: ReturnType<typeof AfricasTalking> | null = null;
function getClient() {
  if (!KEY) return null;
  if (!client) client = AfricasTalking({ apiKey: KEY, username: USERNAME });
  return client;
}

export async function sendSms(opts: { to: string; body: string }) {
  const c = getClient();
  if (!c) {
    // eslint-disable-next-line no-console
    console.log("[sms][dev]", opts.to, opts.body);
    return { ok: true, sandbox: true };
  }
  try {
    await c.SMS.send({
      to: [opts.to],
      message: opts.body,
      from: SENDER,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
