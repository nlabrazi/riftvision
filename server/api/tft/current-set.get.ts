import { tftCurrentSet } from '../../utils/tftCurrentSet'

export default defineEventHandler(async () => {
  try {
    return await tftCurrentSet.getCurrentSet()
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Set TFT actuel indisponible' })
  }
})
