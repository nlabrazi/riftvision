import { getWowClassesClient } from '../../utils/wowClasses'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  try {
    return await getWowClassesClient(
      config.blizzardClientId,
      config.blizzardClientSecret,
    ).getSpecializations()
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'Catalogue des spécialisations WoW indisponible',
    })
  }
})
