import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const defaultIssuer = "IKU Fasilkom";

const base32Encode = (bytes: Buffer) => {
  let output = "";
  let value = 0;
  let bits = 0;

  for (let byteIndex = 0; byteIndex < bytes.length; byteIndex += 1) {
    const byte = bytes[byteIndex];
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += base32Alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += base32Alphabet[(value << (5 - bits)) & 31];
  }

  return output;
};

const base32Decode = (secret: string) => {
  const normalized = secret.replace(/=|\s|-/g, "").toUpperCase();
  const bytes: number[] = [];
  let value = 0;
  let bits = 0;

  for (let charIndex = 0; charIndex < normalized.length; charIndex += 1) {
    const char = normalized[charIndex];
    const index = base32Alphabet.indexOf(char);
    if (index < 0) throw new Error("Secret TOTP tidak valid");
    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
};

const counterBuffer = (counter: number) => {
  const buffer = Buffer.alloc(8);
  const high = Math.floor(counter / 0x100000000);
  const low = counter >>> 0;
  buffer.writeUInt32BE(high, 0);
  buffer.writeUInt32BE(low, 4);
  return buffer;
};

export const generateTotpSecret = () => base32Encode(randomBytes(20));

export const generateTotpCode = (secret: string, timestamp = Date.now(), period = 30, digits = 6) => {
  const counter = Math.floor(timestamp / 1000 / period);
  const hmac = createHmac("sha1", base32Decode(secret)).update(counterBuffer(counter)).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(binary % 10 ** digits).padStart(digits, "0");
};

export const verifyTotpCode = (secret: string, code: string, window = 1) => {
  const normalized = String(code || "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;

  for (let offset = -window; offset <= window; offset += 1) {
    const expected = generateTotpCode(secret, Date.now() + offset * 30 * 1000);
    const expectedBuffer = Buffer.from(expected);
    const codeBuffer = Buffer.from(normalized);
    if (expectedBuffer.length === codeBuffer.length && timingSafeEqual(expectedBuffer, codeBuffer)) {
      return true;
    }
  }

  return false;
};

export const createTotpUri = (account: string, secret: string, issuer = defaultIssuer) => {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });

  return `otpauth://totp/${label}?${params.toString()}`;
};
