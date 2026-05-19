export type DecodedJwtPayload = Record<string, unknown>;

function normalizeBase64Url(input: string) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (base64.length % 4)) % 4;
  return base64 + "=".repeat(padLen);
}

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function decodeJwtPayload(token: string): DecodedJwtPayload | null {
  if (typeof token !== "string" || !token) return null;

  const parts = token.split(".");
  if (parts.length < 2) return null;

  const payloadPart = parts[1];
  if (!payloadPart) return null;

  try {
    const bytes = base64ToBytes(normalizeBase64Url(payloadPart));
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);

    if (!parsed || typeof parsed !== "object") return null;
    return parsed as DecodedJwtPayload;
  } catch {
    return null;
  }
}
