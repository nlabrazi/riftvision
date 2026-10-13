import EventEmitter from 'node:events'

class AlertHub extends EventEmitter {
  private activeClients = 0

  broadcastAlert(alert: unknown) {
    this.emit('alert', alert)
  }

  addClient() {
    this.activeClients++
    this.emit('clientChange', this.activeClients)
  }

  removeClient() {
    this.activeClients = Math.max(0, this.activeClients - 1)
    this.emit('clientChange', this.activeClients)
  }

  getClientCount() {
    return this.activeClients
  }
}

export const alertHub = new AlertHub()
alertHub.setMaxListeners(100)
