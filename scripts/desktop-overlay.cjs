/**
 * RiftVision — Compagnon Desktop Overlay Tête Haute (HUD)
 * 
 * Fenêtre transparente, sans bordure, Always-on-Top et 100% traversante pour la souris (Click-through)
 * superposée à League of Legends (mode Plein écran fenêtré / Borderless).
 * 
 * Intègre :
 *  - Zone de notification Windows (System Tray) avec menu contextuel et statut
 *  - Notification native au démarrage
 *  - Ouverture automatique du tableau de bord dans le navigateur par défaut
 *  - Raccourcis globaux F9 (test) et Ctrl+Shift+O (visibilité)
 */

const path = require('node:path')
const fs = require('node:fs')
const { app, BrowserWindow, globalShortcut, screen, Tray, Menu, shell, Notification } = require('electron')

// Empêche les instances multiples
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  console.log('[RiftVision Overlay] Une instance est déjà en cours d’exécution.')
  app.quit()
  process.exit(0)
}

let overlayWindow = null
let tray = null

function resolveIconPath() {
  const candidates = [
    path.join(__dirname, '..', 'public', 'favicon.ico'),
    path.join(process.resourcesPath, 'public', 'favicon.ico'),
    path.join(__dirname, 'public', 'favicon.ico'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return ''
}

function getDashboardUrl() {
  const customUrl = process.env.RIFTVISION_URL
  if (customUrl) {
    try {
      const u = new URL(customUrl)
      return `${u.protocol}//${u.host}`
    } catch {
      return customUrl
    }
  }
  return 'http://localhost:3000'
}

function triggerTestAlert() {
  console.log('[RiftVision Overlay] Déclenchement de l’alerte de test !')
  if (overlayWindow && overlayWindow.webContents) {
    overlayWindow.webContents.executeJavaScript(`
      if (window.__triggerDemoAlert) {
        window.__triggerDemoAlert('DRAGON')
      }
    `).catch(() => {})
  }
}

function toggleOverlayVisibility() {
  if (overlayWindow) {
    if (overlayWindow.isVisible()) {
      overlayWindow.hide()
      console.log('[RiftVision Overlay] Overlay masqué')
    } else {
      overlayWindow.show()
      console.log('[RiftVision Overlay] Overlay affiché')
    }
  }
}

function createTray() {
  const iconPath = resolveIconPath()
  try {
    tray = new Tray(iconPath)
    tray.setToolTip('RiftVision Overlay — Compagnon In-Game Actif')

    const contextMenu = Menu.buildFromTemplate([
      { label: '🟢 RiftVision Overlay (Actif)', enabled: false },
      { type: 'separator' },
      {
        label: '🌐 Ouvrir le tableau de bord',
        click: () => {
          shell.openExternal(getDashboardUrl())
        },
      },
      {
        label: '⚡ Tester une alerte in-game (F9)',
        click: () => {
          triggerTestAlert()
        },
      },
      {
        label: '👁️ Masquer / Afficher l’overlay (Ctrl+Shift+O)',
        click: () => {
          toggleOverlayVisibility()
        },
      },
      { type: 'separator' },
      {
        label: '❌ Quitter RiftVision',
        click: () => {
          app.quit()
        },
      },
    ])

    tray.setContextMenu(contextMenu)
    tray.on('double-click', () => {
      shell.openExternal(getDashboardUrl())
    })

    // Notification toast native au démarrage
    if (Notification.isSupported()) {
      new Notification({
        title: 'RiftVision Overlay est actif !',
        body: 'Superposé à League of Legends. Appuyez sur F9 pour tester ou faites un clic droit sur l’icône dans la barre des tâches pour ouvrir le tableau de bord.',
        icon: iconPath,
      }).show()
    }
  } catch (err) {
    console.warn('[RiftVision Overlay] Note Tray :', err.message)
  }
}

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
    console.error(`[RiftVision Overlay] ✗ En attente de connexion (${errorCode}) : ${errorDescription}`)
    console.log('[RiftVision Overlay] En attente du tableau de bord sur http://localhost:3000...')
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
  createTray()

  // Ouvre automatiquement le tableau de bord web dans le navigateur par défaut
  if (process.env.RIFTVISION_NO_BROWSER !== '1') {
    setTimeout(() => {
      console.log(`[RiftVision Overlay] Ouverture du tableau de bord dans le navigateur : ${getDashboardUrl()}`)
      shell.openExternal(getDashboardUrl()).catch(() => {})
    }, 1200)
  }

  // Raccourci global F9 : déclenche une alerte de test n'importe où
  globalShortcut.register('F9', () => {
    triggerTestAlert()
  })

  // Raccourci global Ctrl+Shift+O (lettre O) : bascule la visibilité
  globalShortcut.register('CommandOrControl+Shift+O', () => {
    toggleOverlayVisibility()
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
  if (tray) {
    tray.destroy()
    tray = null
  }
})
