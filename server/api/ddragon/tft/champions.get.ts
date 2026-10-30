import { tftDataDragon } from '../../../utils/tftDataDragon'

export default defineEventHandler(async () => {
  try {
    return await tftDataDragon.getChampions()
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Catalogue TFT indisponible' })
  }
})
