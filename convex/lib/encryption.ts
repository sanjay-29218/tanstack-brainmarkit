export function encrypt(value: string): string {
  // NOTE: Encryption intentionally disabled for now.
  // This keeps Convex functions compatible with the default runtime (no Node "crypto").
  return value
}

export function decrypt(encryptedValue: string): string {
  // NOTE: Encryption intentionally disabled for now.
  return encryptedValue
}

export function maskApiKey(key: string | null | undefined): string | null {
  if (!key) return null
  if (key.length <= 8) return '****'
  return `${key.slice(0, 4)}${'*'.repeat(Math.max(8, key.length - 8))}${key.slice(-4)}`
}

