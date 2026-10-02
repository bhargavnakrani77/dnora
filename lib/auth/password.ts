import crypto from "crypto";

/**
 * Hashes a plain-text password using cryptographic scrypt with a unique random salt.
 * Produces a format: `${salt}:${derivedKeyHex}`.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Securely verifies a plain-text password against a stored scrypt hash using timing-safe comparison.
 */
export async function verifyPassword(password: string, storedHash?: string | null): Promise<boolean> {
  if (!password || !storedHash) return false;
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(key, "hex");
    if (derivedKey.length !== keyBuffer.length) return false;
    return crypto.timingSafeEqual(derivedKey, keyBuffer);
  } catch (err) {
    console.error("Error during password verification:", err);
    return false;
  }
}
