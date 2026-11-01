import { championMedia } from '../../../utils/championMedia'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') ?? ''
  const version = getQuery(event).version
  if (!/^[1-9]\d{0,6}$/.test(id) || typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version))
    throw createError({ statusCode: 400, statusMessage: 'Paramètres invalides' })
  try {
    return await championMedia.getMedia(id, version)
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Vidéos de compétences indisponibles' })
  }
})
