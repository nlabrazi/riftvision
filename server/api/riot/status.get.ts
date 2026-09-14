import { checkRiotConnection, isMockMode, setMockMode } from '../../utils/riotClient'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  if (query.toggleMock !== undefined) {
    setMockMode(!isMockMode())
  } else if (query.setMock !== undefined) {
    setMockMode(query.setMock === 'true')
  }

  const forceMock = query.mock !== undefined ? query.mock === 'true' : undefined
  const status = await checkRiotConnection(forceMock)

  return {
    ...status,
    globalMockEnabled: isMockMode(),
  }
})
