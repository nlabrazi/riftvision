import type { SavedMatch } from '../../../shared/types/history'
import { saveMatch } from '../../utils/matchHistoryStorage'

export default defineEventHandler(async (event) => {
  const body = await readBody<SavedMatch>(event)

  if (!body?.id || !body?.gameData) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid match payload: id and gameData are required.',
    })
  }

  const matches = saveMatch(body)
  return {
    success: true,
    count: matches.length,
    match: body,
  }
})
