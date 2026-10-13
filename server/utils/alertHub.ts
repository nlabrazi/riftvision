import EventEmitter from 'node:events'

class AlertHub extends EventEmitter {
  broadcastAlert(alert: unknown) {
    this.emit('alert', alert)
  }
}

export const alertHub = new AlertHub()
alertHub.setMaxListeners(100)
