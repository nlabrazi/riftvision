import { getWowClassesClient, WowClassNotFoundError } from '../../../utils/wowClasses'

export default defineEventHandler(async (event) => {
  const rawId = getRouterParam(event, 'id') ?? ''
  if (!/^[1-9]\d{0,5}$/.test(rawId))
    throw createError({ statusCode: 404, statusMessage: 'Classe WoW introuvable' })
  const config = useRuntimeConfig(event)
  try {
    return await getWowClassesClient(config.blizzardClientId, config.blizzardClientSecret).getClass(
      Number(rawId),
    )
  } catch (error) {
    if (error instanceof WowClassNotFoundError)
      throw createError({ statusCode: 404, statusMessage: 'Classe WoW introuvable' })
    throw createError({ statusCode: 503, statusMessage: 'Classe WoW indisponible' })
  }
})
