import { tftDataDragon } from '../../../utils/tftDataDragon'

export default defineEventHandler(async () => {
  try {
    return await tftDataDragon.getItems()
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Catalogue des objets TFT indisponible' })
  }
})
