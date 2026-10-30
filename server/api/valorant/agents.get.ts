import { valorantAgents } from '../../utils/valorantAgents'

export default defineEventHandler(async () => {
  try {
    return await valorantAgents.getAgents()
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Catalogue Valorant indisponible' })
  }
})
