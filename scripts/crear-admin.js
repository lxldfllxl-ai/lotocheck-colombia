const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const password = 'TuPasswordSeguro123!';
const email = 'tuemail@ejemplo.com';

const hash = bcrypt.hashSync(password, 10);

// Generar secreto TOTP en formato Base32 (32 caracteres)
const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
let totpSecret = '';
const randomBytes = crypto.randomBytes(20);
for (let i = 0; i < 32; i++) {
  totpSecret += base32chars[randomBytes[i % 20] % 32];
}

console.log('--- Copia esto y pégalo en Supabase SQL Editor ---');
console.log(`insert into admin_users (email, password_hash, totp_secret, totp_activado, rol) values ('${email}', '${hash}', '${totpSecret}', true, 'admin');`);
console.log('--- Guarda este secreto TOTP, lo necesitarás para el QR ---');
console.log('TOTP SECRET:', totpSecret);