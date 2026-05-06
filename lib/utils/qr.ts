import jwt from "jsonwebtoken";

const SECRET = process.env.QR_TOKEN_SECRET ?? process.env.BETTER_AUTH_SECRET;

export interface TicketTokenPayload {
  ticketId: string;
  userId: string;
  eventId: string;
}

export function signTicketToken(payload: TicketTokenPayload, expiresInSec = 60 * 60 * 24 * 30) {
  if (!SECRET) throw new Error("QR_TOKEN_SECRET / BETTER_AUTH_SECRET is not set");
  return jwt.sign(payload, SECRET, { expiresIn: expiresInSec });
}

export function verifyTicketToken(token: string): TicketTokenPayload {
  if (!SECRET) throw new Error("QR_TOKEN_SECRET / BETTER_AUTH_SECRET is not set");
  return jwt.verify(token, SECRET) as TicketTokenPayload;
}
