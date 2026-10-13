import { beforeEach, describe, expect, it, vi } from 'vitest'
import { alertHub } from '../../server/utils/alertHub'

describe('alertHub', () => {
  beforeEach(() => {
    // Reset client count between tests if needed
    while (alertHub.getClientCount() > 0) {
      alertHub.removeClient()
    }
  })

  it('tracks connected SSE clients and emits clientChange events', () => {
    const listener = vi.fn()
    alertHub.on('clientChange', listener)

    expect(alertHub.getClientCount()).toBe(0)

    alertHub.addClient()
    expect(alertHub.getClientCount()).toBe(1)
    expect(listener).toHaveBeenCalledWith(1)

    alertHub.addClient()
    expect(alertHub.getClientCount()).toBe(2)
    expect(listener).toHaveBeenCalledWith(2)

    alertHub.removeClient()
    expect(alertHub.getClientCount()).toBe(1)
    expect(listener).toHaveBeenCalledWith(1)

    alertHub.removeClient()
    expect(alertHub.getClientCount()).toBe(0)
    expect(listener).toHaveBeenCalledWith(0)

    // Should not go below 0
    alertHub.removeClient()
    expect(alertHub.getClientCount()).toBe(0)

    alertHub.off('clientChange', listener)
  })

  it('broadcasts alerts to subscribers', () => {
    const onAlert = vi.fn()
    alertHub.on('alert', onAlert)

    const payload = { id: 'test-123', type: 'DRAGON', title: 'DRAGON' }
    alertHub.broadcastAlert(payload)

    expect(onAlert).toHaveBeenCalledTimes(1)
    expect(onAlert).toHaveBeenCalledWith(payload)

    alertHub.off('alert', onAlert)
  })
})
