import { createEventStream } from 'h3'
import { alertHub } from '../../utils/alertHub'

export default defineEventHandler((event) => {
  const eventStream = createEventStream(event)

  const onAlert = (data: unknown) => {
    eventStream.push(JSON.stringify(data))
  }

  alertHub.on('alert', onAlert)

  eventStream.onClosed(() => {
    alertHub.off('alert', onAlert)
  })

  return eventStream.send()
})
