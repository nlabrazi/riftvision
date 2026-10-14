import { getStoredMatches } from '../../utils/matchHistoryStorage'

export default defineEventHandler(() => {
  const matches = getStoredMatches()
  return {
    success: true,
    count: matches.length,
    matches,
  }
})
