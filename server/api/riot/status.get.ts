import { checkRiotConnection, isMockMode } from '../../utils/riotClient'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const forceMock = query.mock !== undefined ? query.mock === 'true' : undefined
  const status = await checkRiotConnection(forceMock)

  return {
    ...status,
    globalMockEnabled: isMockMode(),
  }
})
