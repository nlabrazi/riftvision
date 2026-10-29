import { dataDragon, DataDragonChampionNotFoundError } from '../../../utils/dataDragon'

export default defineEventHandler(async (event) => {
  try {
    return await dataDragon.getChampion(getRouterParam(event, 'id') ?? '')
  } catch (error) {
    if (error instanceof DataDragonChampionNotFoundError) {
      throw createError({ statusCode: 404, statusMessage: 'Champion introuvable' })
    }
    throw createError({ statusCode: 503, statusMessage: 'Data Dragon indisponible' })
  }
})
