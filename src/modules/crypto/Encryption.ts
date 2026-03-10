import CryptoJS from 'crypto-js';

// AES-256-CBC encryption using crypto-js (pure JS, no native setup required)
// Format: base64(iv[16] + ciphertext)

export const Encryption = {
  encrypt(plaintext: string, keyHex: string): string {
    const key = CryptoJS.enc.Hex.parse(keyHex);
    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    // Prepend IV to ciphertext so we can decrypt later
    const ivAndCipher = iv.concat(encrypted.ciphertext);
    return CryptoJS.enc.Base64.stringify(ivAndCipher);
  },

  decrypt(ciphertext: string, keyHex: string): string {
    const key = CryptoJS.enc.Hex.parse(keyHex);
    const data = CryptoJS.enc.Base64.parse(ciphertext);
    const iv = CryptoJS.lib.WordArray.create(data.words.slice(0, 4), 16);
    const cipher = CryptoJS.lib.WordArray.create(
      data.words.slice(4),
      data.sigBytes - 16,
    );
    const decrypted = CryptoJS.AES.decrypt(
      {ciphertext: cipher} as CryptoJS.lib.CipherParams,
      key,
      {iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7},
    );
    return decrypted.toString(CryptoJS.enc.Utf8);
  },

  generateKey(): string {
    return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
  },
};
