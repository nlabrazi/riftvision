import { alertHub } from '../../utils/alertHub'

export default defineEventHandler(() => {
  return {
    connected: alertHub.getClientCount() > 0,
    clientCount: alertHub.getClientCount(),
  }
})
