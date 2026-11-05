import { assertMutationAuthorized } from '../../utils/auth'
import { isMockMode, setMockMode } from '../../utils/riotClient'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  assertMutationAuthorized(event, {
    configuredSecret: (config.adminSecret || config.scanSecret) as string | undefined,
  })

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
