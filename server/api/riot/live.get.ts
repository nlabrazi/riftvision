import { fetchAllGameData } from '../../utils/riotClient'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const forceMock = query.mock !== undefined ? query.mock === 'true' : undefined

  try {
    const data = await fetchAllGameData(forceMock)
    return {
      success: true,
      data,
    }
  } catch (err) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Riot Live Client API Unavailable',
      message: (err as Error).message,
    })
  }
})
