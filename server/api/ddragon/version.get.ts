import { dataDragon } from '../../utils/dataDragon'

export default defineEventHandler(async () => {
  try {
    return { version: await dataDragon.getVersion(), locale: 'fr_FR' }
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Data Dragon indisponible' })
  }
})
