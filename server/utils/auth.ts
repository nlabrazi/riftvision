import type { H3Event } from 'h3'
import { createError, getHeader } from 'h3'

/**
 * Extrait le token d'authentification depuis les en-têtes de la requête H3.
 * Supporte :
 * - Authorization: Bearer <token>
 * - x-admin-secret: <token>
 * - x-scan-secret: <token>
 */
export function extractAuthToken(event: H3Event): string | null {
  const authHeader = getHeader(event, 'authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim()
  }

  const adminHeader = getHeader(event, 'x-admin-secret')
  if (adminHeader) {
    return adminHeader.trim()
  }

  const scanHeader = getHeader(event, 'x-scan-secret')
  if (scanHeader) {
    return scanHeader.trim()
  }

  return null
}

export interface MutationAuthOptions {
  configuredSecret?: string
  forceProduction?: boolean
}

/**
 * Protège les endpoints de mutation contre les modifications non autorisées en production.
 *
 * Règles :
 * - En développement / test (hors production) : autorisé sans secret.
 * - En production (process.env.NODE_ENV === 'production' ou forceProduction: true) :
 *   - Si aucun secret n'est configuré sur le serveur -> 403 Forbidden
 *   - Si aucun token n'est fourni -> 403 Forbidden
 *   - Si un token est fourni mais invalide -> 401 Unauthorized
 *   - Si le token correspond au secret -> Autorisé
 */
export function assertMutationAuthorized(
  event: H3Event,
  options?: MutationAuthOptions,
): void {
  const isProduction =
    options?.forceProduction !== undefined
      ? options.forceProduction
      : process.env.NODE_ENV === 'production'

  if (!isProduction) {
    return
  }

  const secret =
    options?.configuredSecret ||
    process.env.NUXT_ADMIN_SECRET ||
    process.env.ADMIN_SECRET ||
    process.env.NUXT_SCAN_SECRET ||
    process.env.SCAN_SECRET

  if (!secret) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Modifications interdites en production : aucun secret d’administration configuré.',
    })
  }

  const token = extractAuthToken(event)
  if (!token) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Modifications interdites en production : authentification requise.',
    })
  }

  if (token !== secret) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Non autorisé : token d’administration invalide.',
    })
  }
}
