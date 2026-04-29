const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export function generateShortCode(length = 6): string {
  let code = '';
  const bytes = new Uint8Array(length * 2);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < bytes.length && code.length < length; i++) {
    const idx = bytes[i] % 62;
    code += BASE62[idx];
  }
  return code;
}
