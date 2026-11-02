import { getWowClassesClient } from '../../../../utils/wowClasses'

export default defineEventHandler(async (event) => {
  const rawId = getRouterParam(event, 'id') ?? ''
  if (!/^[1-9]\d{0,5}$/.test(rawId))
    throw createError({ statusCode: 404, statusMessage: 'Spécialisation WoW introuvable' })
  const config = useRuntimeConfig(event)
  try {
    return await getWowClassesClient(
      config.blizzardClientId,
      config.blizzardClientSecret,
    ).getTalents(Number(rawId))
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Talents WoW indisponibles' })
  }
})
