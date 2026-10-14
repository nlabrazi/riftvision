const { contextBridge, ipcRenderer } = require('electron')

/**
 * RiftVision Overlay — Script Preload sécurisé
 * Expose une API restreinte pour le contrôle des événements souris et du mode calibration.
 */
contextBridge.exposeInMainWorld('riftvisionBridge', {
  setIgnoreMouseEvents: (ignore) => {
    ipcRenderer.send('set-ignore-mouse-events', Boolean(ignore))
  },
  setCalibrationMode: (enabled) => {
    ipcRenderer.send('set-calibration-mode', Boolean(enabled))
  },
  onToggleCalibration: (callback) => {
    ipcRenderer.on('toggle-calibration', (_event, enabled) => {
      if (typeof callback === 'function') {
        callback(enabled)
      }
    })
  },
})
