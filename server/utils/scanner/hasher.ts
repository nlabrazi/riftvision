import { createHash } from 'node:crypto'

/**
 * Normalise récursivement une valeur pour garantir un hachage canonique :
 * - Trie les clés d'objets alphabétiquement
 * - Ignore les valeurs undefined
 * - Convertit de manière déterministe en chaîne
 */
export function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map(canonicalStringify).join(',')}]`
  }

  const record = value as Record<string, unknown>
  const sortedKeys = Object.keys(record).sort()
  const entries = sortedKeys
    .filter((k) => record[k] !== undefined)
    .map((k) => `${JSON.stringify(k)}:${canonicalStringify(record[k])}`)

  return `{${entries.join(',')}}`
}

/**
 * Calcule une empreinte SHA-256 déterministe (tronquée à 16 caractères par défaut).
 */
export function computeCanonicalHash(data: unknown, length = 16): string {
  const serialized = canonicalStringify(data)
  return createHash('sha256').update(serialized).digest('hex').slice(0, length)
}

