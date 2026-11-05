import { alertHub } from '../../utils/alertHub'
import { assertMutationAuthorized } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  assertMutationAuthorized(event, {
    configuredSecret: (config.adminSecret || config.scanSecret) as string | undefined,
  })

  const body = await readBody(event)
  if (body) {
    alertHub.broadcastAlert(body)
  }
  return { success: true }
})
