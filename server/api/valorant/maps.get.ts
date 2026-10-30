import { valorantMaps } from '../../utils/valorantMaps'

export default defineEventHandler(async () => {
  try {
    return await valorantMaps.getMaps()
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'Catalogue des cartes Valorant indisponible',
    })
  }
})
