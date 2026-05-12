import jwt from "jsonwebtoken";

const SECRET =
  process.env.QR_TOKEN_SECRET ??
  process.env.BETTER_AUTH_SECRET ??
  "dev-qr-secret";

export function signTicketToken(payload: {
  ticketCode: string;
  userId: string;
  eventId: string;
  jti: string;
}) {
  return jwt.sign(payload, SECRET, { expiresIn: "30d" });
}

export function verifyTicketToken(token: string) {
  return jwt.verify(token, SECRET) as {
    ticketCode: string;
    userId: string;
    eventId: string;
    jti: string;
  };
}
