import {
  clearAllStoredMatches,
  deleteStoredMatch,
  getStoredMatches,
} from '../../utils/matchHistoryStorage'

export default defineEventHandler((event) => {
  const query = getQuery(event)

  if (query.clear === '1' || query.clear === 'true') {
    clearAllStoredMatches()
    return {
      success: true,
      message: 'Match history cleared.',
      count: 0,
    }
  }

  const id = typeof query.id === 'string' ? query.id : ''
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing match id to delete (or ?clear=1 to clear all).',
    })
  }

  const deleted = deleteStoredMatch(id)
  const remaining = getStoredMatches()

  return {
    success: deleted,
    count: remaining.length,
  }
})
