import { getWowClassesClient } from '../../utils/wowClasses'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  try {
    return await getWowClassesClient(
      config.blizzardClientId,
      config.blizzardClientSecret,
    ).getRaces()
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Catalogue des races WoW indisponible' })
  }
})
