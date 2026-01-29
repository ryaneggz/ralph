import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is required");
  }
  // Derive a 32-byte key from the provided secret using SHA-256
  return crypto.createHash("sha256").update(key).digest();
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a base64 string in the format: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

/**
 * Decrypt a string encrypted with encrypt().
 */
export function decrypt(encryptedString: string): string {
  const key = getEncryptionKey();
  const [ivB64, authTagB64, ciphertext] = encryptedString.split(":");

  if (!ivB64 || !authTagB64 || !ciphertext) {
    throw new Error("Invalid encrypted string format");
  }

  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Check if encryption is configured (ENCRYPTION_KEY env var exists).
 */
export function isEncryptionConfigured(): boolean {
  return !!process.env.ENCRYPTION_KEY;
}
