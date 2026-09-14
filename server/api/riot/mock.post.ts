import { isMockMode, setMockMode } from '../../utils/riotClient'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ enabled?: boolean }>(event)
  if (typeof body?.enabled === 'boolean') {
    setMockMode(body.enabled)
  } else {
    setMockMode(!isMockMode())
  }

  return {
    mockEnabled: isMockMode(),
  }
})
