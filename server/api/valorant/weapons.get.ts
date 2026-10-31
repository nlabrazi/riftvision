import { valorantWeapons } from '../../utils/valorantWeapons'

export default defineEventHandler(async () => {
  try {
    return await valorantWeapons.getWeapons()
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'Catalogue des armes Valorant indisponible',
    })
  }
})
