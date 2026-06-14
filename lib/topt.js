import crypto from 'crypto';

// Decodifica un secreto Base32 a Buffer
function base32Decode(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const char of base32.toUpperCase().replace(/=+$/, '')) {
    const val = alphabet.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

// Genera el código TOTP de 6 dígitos para un momento dado
function generarCodigo(secret, time) {
  const key = base32Decode(secret);
  const counter = Math.floor(time / 30);

  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buffer.writeUInt32BE(counter % 0x100000000, 4);

  const hmac = crypto.createHmac('sha1', key).update(buffer).digest();

  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (code % 1000000).toString().padStart(6, '0');
}

// Verifica un código TOTP permitiendo +-1 ventana de 30s (tolerancia de reloj)
export function verificarTOTP(token, secret) {
  if (!token || !secret) return false;
  const now = Math.floor(Date.now() / 1000);

  for (let errorWindow = -1; errorWindow <= 1; errorWindow++) {
    const tiempoVentana = now + errorWindow * 30;
    if (generarCodigo(secret, tiempoVentana) === token) {
      return true;
    }
  }
  return false;
}