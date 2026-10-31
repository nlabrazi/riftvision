import { getWowClassesClient } from '../../../../utils/wowClasses'

export default defineEventHandler(async (event) => {
  const rawId = getRouterParam(event, 'id') ?? ''
  if (!/^[1-9]\d{0,7}$/.test(rawId) || Number(rawId) > 10000000)
    throw createError({ statusCode: 404, statusMessage: 'Visuel introuvable' })
  const config = useRuntimeConfig(event)
  let icon: string | null
  try {
    icon = await getWowClassesClient(
      config.blizzardClientId,
      config.blizzardClientSecret,
    ).getSpellIcon(Number(rawId))
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Visuel indisponible' })
  }
  if (!icon) throw createError({ statusCode: 404, statusMessage: 'Visuel introuvable' })
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return sendRedirect(event, icon, 302)
})
