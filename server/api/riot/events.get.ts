import { fetchEventData } from '../../utils/riotClient'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const forceMock = query.mock !== undefined ? query.mock === 'true' : undefined
  const fromId = query.fromId ? Number.parseInt(String(query.fromId), 10) : undefined

  try {
    const events = await fetchEventData(fromId, forceMock)
    return {
      success: true,
      events,
      count: events.length,
    }
  } catch (err) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Riot Live Client API Unavailable',
      message: (err as Error).message,
    })
  }
})
