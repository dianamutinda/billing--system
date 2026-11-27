const crypto = require('crypto');

const KEY = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
if (KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
}

function encrypt(plain) {
  if (plain === null || plain === undefined) {
    throw new TypeError('Cannot encrypt null or undefined value');
  }

  const text = String(plain);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString('base64'),
    tag.toString('base64'),
    enc.toString('base64'),
  ].join('.');
}

function decrypt(payload) {
  if (typeof payload !== 'string' || !payload) {
    throw new TypeError('Encrypted payload must be a non-empty string');
  }

  const parts = payload.split('.');
  if (parts.length !== 3 || parts.some((p) => !p)) {
    throw new Error('Invalid encrypted payload format');
  }

  const iv = Buffer.from(parts[0], 'base64');
  const tag = Buffer.from(parts[1], 'base64');
  const enc = Buffer.from(parts[2], 'base64');

  if (iv.length !== 12 || tag.length !== 16 || enc.length === 0) {
    throw new Error('Invalid encrypted payload segment lengths');
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

module.exports = { encrypt, decrypt };