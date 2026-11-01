import { valorantAbilityMedia } from '../../../../utils/valorantAbilityMedia'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') ?? ''
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id))
    throw createError({ statusCode: 404, statusMessage: 'Agent introuvable' })
  try {
    return await valorantAbilityMedia.getMedia(id)
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Vidéos Valorant indisponibles' })
  }
})
