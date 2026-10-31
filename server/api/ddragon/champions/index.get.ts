import { dataDragon } from '../../../utils/dataDragon'

export default defineEventHandler(async () => {
  try {
    return await dataDragon.getChampions()
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Data Dragon indisponible' })
  }
})
