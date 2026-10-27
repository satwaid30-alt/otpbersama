/**
 * Pure TypeScript RFC 6238 TOTP Generator using Web Crypto API
 * Works completely offline in the browser without external dependencies.
 */

// Decode Base32 string to Uint8Array
export function base32ToBytes(base32: string): Uint8Array {
  const cleaned = base32.replace(/[\s=-]/g, "").toUpperCase();
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    const index = alphabet.indexOf(char);
    if (index === -1) {
      continue; // Skip invalid characters
    }
    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

// Convert bytes to Base32 string
export function bytesToBase32(bytes: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;

    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }

  return output;
}

// Generate random Base32 secret key (16 characters / 80 bits, standard TOTP key)
export function generateRandomSecret(length = 16): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const array = new Uint8Array(length);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  let secret = "";
  for (let i = 0; i < length; i++) {
    secret += alphabet[array[i] % alphabet.length];
  }
  return secret;
}

/**
 * Generate 6-digit TOTP code for a given base32 secret and timestamp
 */
export async function generateTOTP(
  secretBase32: string,
  timestampMs: number = Date.now(),
  stepSeconds: number = 30,
  digits: number = 6
): Promise<string> {
  try {
    const keyBytes = base32ToBytes(secretBase32);
    if (keyBytes.length === 0) {
      return "000000";
    }

    const epochSeconds = Math.floor(timestampMs / 1000);
    const counter = Math.floor(epochSeconds / stepSeconds);

    // Prepare 8-byte big-endian buffer for counter
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setUint32(0, 0, false); // High 32 bits (safe for next 50+ years)
    view.setUint32(4, counter, false); // Low 32 bits

    // Import key for HMAC-SHA1
    const cryptoSubtle = window.crypto.subtle;
    const cryptoKey = await cryptoSubtle.importKey(
      "raw",
      keyBytes as unknown as BufferSource,
      { name: "HMAC", hash: { name: "SHA-1" } },
      false,
      ["sign"]
    );

    // Compute HMAC
    const signature = await cryptoSubtle.sign("HMAC", cryptoKey, buffer);
    const hmacResult = new Uint8Array(signature);

    // Dynamic truncation (RFC 4226)
    const offset = hmacResult[hmacResult.length - 1] & 0x0f;
    const binary =
      ((hmacResult[offset] & 0x7f) << 24) |
      ((hmacResult[offset + 1] & 0xff) << 16) |
      ((hmacResult[offset + 2] & 0xff) << 8) |
      (hmacResult[offset + 3] & 0xff);

    const otp = binary % Math.pow(10, digits);
    return otp.toString().padStart(digits, "0");
  } catch (error) {
    console.error("Error generating TOTP:", error);
    return "000000";
  }
}

/**
 * Calculate remaining seconds and progress percentage (0 to 1) in the current 30-second window
 */
export function getTimerState(stepSeconds = 30): {
  remainingSeconds: number;
  progress: number;
} {
  const now = Date.now();
  const currentSecond = Math.floor(now / 1000) % stepSeconds;
  const remainingSeconds = stepSeconds - currentSecond;
  // progress from 1.0 (start) down to 0.0 (end)
  const progress = remainingSeconds / stepSeconds;
  return { remainingSeconds, progress };
}

/**
 * Parse otpauth://totp/ URI format
 * Example: otpauth://totp/Kemdikbud:operator@sekolah.id?secret=JBSWY3DPEHPK3PXP&issuer=Kemdikbud
 */
export function parseOtpAuthUri(uri: string): {
  issuer?: string;
  account?: string;
  secret?: string;
  digits?: number;
  period?: number;
} | null {
  try {
    if (!uri.startsWith("otpauth://")) return null;
    const url = new URL(uri);
    if (url.hostname !== "totp") return null;

    let label = decodeURIComponent(url.pathname.replace(/^\//, ""));
    let issuer = url.searchParams.get("issuer") || "";
    let account = label;

    if (label.includes(":")) {
      const parts = label.split(":");
      issuer = issuer || parts[0].trim();
      account = parts.slice(1).join(":").trim();
    }

    const secret = url.searchParams.get("secret")?.replace(/\s+/g, "") || "";
    const digits = parseInt(url.searchParams.get("digits") || "6", 10);
    const period = parseInt(url.searchParams.get("period") || "30", 10);

    return {
      issuer: issuer || "Google",
      account: account || "User",
      secret,
      digits: isNaN(digits) ? 6 : digits,
      period: isNaN(period) ? 30 : period,
    };
  } catch {
    return null;
  }
}

/**
 * Build otpauth://totp/ URI for QR Code or Export
 */
export function buildOtpAuthUri(
  account: string,
  secret: string,
  issuer: string,
  period = 30,
  digits = 6
): string {
  const cleanSecret = secret.replace(/\s+/g, "").toUpperCase();
  const cleanIssuer = encodeURIComponent(issuer.trim());
  const cleanAccount = encodeURIComponent(account.trim());
  return `otpauth://totp/${cleanIssuer}:${cleanAccount}?secret=${cleanSecret}&issuer=${cleanIssuer}&algorithm=SHA1&digits=${digits}&period=${period}`;
}
