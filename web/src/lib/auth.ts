import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const primarySecret = process.env.JWT_SECRET || "wpip-dev-secret";

const signingSecret = new TextEncoder().encode(primarySecret);

// Accept tokens from both the web and the Python backend regardless of
// which default secret was in use when the token was issued.
const knownSecrets = ["wpip-dev-secret", "gigguard-dev-secret"];
const verifySecrets = [
  new TextEncoder().encode(primarySecret),
  ...knownSecrets
    .filter(s => s !== primarySecret)
    .map(s => new TextEncoder().encode(s)),
];

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(signingSecret);
}

export async function verifyToken(token: string): Promise<string | null> {
  for (const secret of verifySecrets) {
    try {
      const { payload } = await jwtVerify(token, secret);
      if (payload.sub) return payload.sub as string;
    } catch {
      // try next known secret
    }
  }

  return null;
}
