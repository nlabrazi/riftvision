import { tftDataDragon } from '../../../utils/tftDataDragon'

export default defineEventHandler(async () => {
  try {
    return await tftDataDragon.getTraits()
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Catalogue des traits TFT indisponible' })
  }
})
