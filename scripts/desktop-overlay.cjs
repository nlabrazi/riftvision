/**
 * RiftVision — Compagnon Desktop Overlay Tête Haute (HUD)
 * 
 * Fenêtre transparente, sans bordure, Always-on-Top et 100% traversante pour la souris (Click-through)
 * superposée à League of Legends (mode Plein écran fenêtré / Borderless).
 * 
 * Lancement sous Windows :
 *   electron desktop-overlay.cjs
 */

const { app, BrowserWindow, globalShortcut, screen } = require('electron')

// Empêche les instances multiples
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  console.log('[RiftVision Overlay] Une instance est déjà en cours d’exécution.')
  app.quit()
  process.exit(0)
}

let overlayWindow = null

function createOverlayWindow() {
  const displays = screen.getAllDisplays()
  const primaryDisplay = screen.getPrimaryDisplay()

  console.log(`[RiftVision Overlay] ${displays.length} écran(s) détecté(s) :`)
  displays.forEach((d, idx) => {
    const isPrimary = d.id === primaryDisplay.id ? ' (Principal)' : ''
    console.log(`  • Écran ${idx} : ${d.bounds.width}x${d.bounds.height} à (${d.bounds.x}, ${d.bounds.y})${isPrimary}`)
  })

  // Choix de l'écran cible (par défaut : écran principal où tourne le jeu)
  const targetDisplayIndex = process.env.RIFTVISION_DISPLAY !== undefined 
    ? parseInt(process.env.RIFTVISION_DISPLAY, 10) 
    : displays.findIndex(d => d.id === primaryDisplay.id)
  
  const displayToUse = displays[targetDisplayIndex] || primaryDisplay
  const { width, height, x, y } = displayToUse.bounds

  overlayWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    fullscreen: false,
    skipTaskbar: true,
    hasShadow: false,
    resizable: false,
    movable: false,
    focusable: false,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  })

  // Click-Through : les clics et mouvements de souris traversent directement vers League of Legends
  overlayWindow.setIgnoreMouseEvents(true, { forward: true })

  // Maintient la fenêtre au premier plan absolu au-dessus des jeux DirectX
  overlayWindow.setAlwaysOnTop(true, 'screen-saver')
  overlayWindow.setVisibleOnAllWorkspaces(true)

  const targetUrl = process.env.RIFTVISION_URL || 'http://localhost:3000/overlay'
  console.log(`[RiftVision Overlay] Chargement de : ${targetUrl}`)
  console.log(`[RiftVision Overlay] Affichage sur écran : ${width}x${height} à (${x}, ${y})`)
  console.log('[RiftVision Overlay] Commandes globales :')
  console.log('  • F9 : Déclencher une alerte de test immédiatement')
  console.log('  • Ctrl + Shift + O (lettre O) : Masquer / Afficher l’overlay')

  overlayWindow.webContents.on('did-finish-load', () => {
    console.log('[RiftVision Overlay] ✓ Connecté à RiftVision ! L’overlay est actif et transparent.')
    overlayWindow.show()
  })

  overlayWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error(`[RiftVision Overlay] ✗ Erreur de chargement (${errorCode}) : ${errorDescription}`)
    console.error('[RiftVision Overlay] Assurez-vous que le serveur RiftVision tourne (npm run dev).')
  })

  overlayWindow.webContents.on('console-message', (_event, _level, message) => {
    console.log(`[Overlay Web] ${message}`)
  })

  overlayWindow.loadURL(targetUrl)

  overlayWindow.on('closed', () => {
    overlayWindow = null
  })
}

app.whenReady().then(() => {
  createOverlayWindow()

  // Raccourci global F9 : déclenche une alerte de test n'importe où
  globalShortcut.register('F9', () => {
    console.log('[RiftVision Overlay] Touche F9 détectée -> déclenchement de l’alerte de test !')
    if (overlayWindow && overlayWindow.webContents) {
      overlayWindow.webContents.executeJavaScript(`
        if (window.__triggerDemoAlert) {
          window.__triggerDemoAlert('DRAGON')
        }
      `).catch(() => {})
    }
  })

  // Raccourci global Ctrl+Shift+O (lettre O) : bascule la visibilité
  globalShortcut.register('CommandOrControl+Shift+O', () => {
    if (overlayWindow) {
      if (overlayWindow.isVisible()) {
        overlayWindow.hide()
        console.log('[RiftVision Overlay] Overlay masqué')
      } else {
        overlayWindow.show()
        console.log('[RiftVision Overlay] Overlay affiché')
      }
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createOverlayWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
