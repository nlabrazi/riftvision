import type { H3Event } from 'h3'
import { createError } from 'h3'
import { extractAuthToken } from '../auth'

/**
 * Extrait le token de scan de l'événement H3 (Authorization Bearer, x-scan-secret ou x-admin-secret).
 */
export function extractScanToken(event: H3Event): string | null {
  return extractAuthToken(event)
}

/**
 * Valide que le token fourni correspond au secret configuré.
 * Lève une erreur 401 si non autorisé ou 403 si aucun secret n'est configuré.
 */
export function assertScanAuthorized(event: H3Event, configuredSecret?: string): void {
  const secret = configuredSecret || process.env.NUXT_SCAN_SECRET || process.env.SCAN_SECRET

  if (!secret) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Accès refusé : secret de scan non configuré sur le serveur.',
    })
  }

  const token = extractScanToken(event)
  if (!token || token !== secret) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Non autorisé : token de scan invalide ou manquant.',
    })
  }
}
