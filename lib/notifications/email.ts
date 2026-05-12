const KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM ?? "Evermore <hello@evermore.co.ke>";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!KEY) {
    // eslint-disable-next-line no-console
    console.log("[email][dev]", opts.to, opts.subject);
    return { ok: true, sandbox: true };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  });
  return { ok: res.ok };
}
