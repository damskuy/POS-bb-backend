import jwt from "jsonwebtoken";

const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || "super_secret_key_123456789";
};

export interface JWTPayload {
  id: number;
  email: string;
  role: string;
}

export function generateAccessToken(payload: JWTPayload) {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, {
    expiresIn: "7d",
  });
}

export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const secret = getJwtSecret();
    const [headerB64, payloadB64, signatureB64] = parts;

    const encoder = new TextEncoder();
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const keyData = encoder.encode(secret);

    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const base64 = signatureB64.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    const paddedBase64 = pad ? base64 + "=".repeat(4 - pad) : base64;

    const binaryStr = atob(paddedBase64);
    const signatureBin = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      signatureBin[i] = binaryStr.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBin,
      data
    );

    if (!isValid) return null;

    const payloadBase64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const payloadPad = payloadBase64.length % 4;
    const paddedPayloadBase64 = payloadPad ? payloadBase64 + "=".repeat(4 - payloadPad) : payloadBase64;

    const payloadJson = atob(paddedPayloadBase64);
    const payload = JSON.parse(payloadJson) as JWTPayload;

    return payload;
  } catch (err) {
    console.error("JWT VERIFY ERROR:", err);
    return null;
  }
}