import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { schema } from "@/db";

const devTrustedOrigins = [
  process.env.BETTER_AUTH_URL,
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  "http://localhost:3003",
  "http://127.0.0.1:3003",
].filter((o): o is string => Boolean(o));

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET || "dev-secret-replace-with-openssl-rand-base64-32",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3003",
  trustedOrigins: devTrustedOrigins,
  plugins: [nextCookies()],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      // Hook into notification layer.
      // eslint-disable-next-line no-console
      console.log(`[auth] reset password for ${user.email}: ${url}`);
    },
  },
  socialProviders:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : undefined,
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "user" },
      tier: { type: "string", required: false, defaultValue: "free" },
      mode: { type: "string", required: false, defaultValue: "explorer" },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
