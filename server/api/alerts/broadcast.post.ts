import { alertHub } from '../../utils/alertHub'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (body) {
    alertHub.broadcastAlert(body)
  }
  return { success: true }
})
