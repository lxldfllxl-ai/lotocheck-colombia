const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || '';

export function normalizePhoneNumber(phone) {
  if (!phone) return '';
  let value = String(phone).trim();
  value = value.replace(/[^\d+]/g, '');

  if (value.startsWith('+')) {
    value = '+' + value.slice(1).replace(/\D/g, '');
  } else {
    value = value.replace(/\D/g, '');
    if (value.length === 10 && value.startsWith('3')) {
      value = '+57' + value;
    } else if (value.length === 11 && value.startsWith('57')) {
      value = '+' + value;
    } else if (value.length === 9) {
      value = '+57' + value;
    }
  }

  return value;
}

export function isPhoneNumberValid(phone) {
  const normalized = normalizePhoneNumber(phone);
  return typeof normalized === 'string' && /^\+[1-9]\d{6,14}$/.test(normalized);
}

export function createVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendSmsViaTwilio({ to, body }) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    console.warn('Twilio env variables not configured.');
    return false;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const params = new URLSearchParams();
  params.append('From', TWILIO_FROM_NUMBER);
  params.append('To', to);
  params.append('Body', body);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Twilio SMS error:', response.status, text);
    return false;
  }

  return true;
}
