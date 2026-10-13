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
const { app, BrowserWindow, globalShortcut, screen, Tray, Menu, shell, Notification, nativeImage, dialog } = require('electron')

// Empêche les instances multiples
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  console.log('[RiftVision Overlay] Une instance est déjà en cours d’exécution.')
  app.quit()
  process.exit(0)
}

let overlayWindow = null
let tray = null

// Icône Hextech native 32x32 intégrée en Base64 (garantit un affichage 100% fiable en toutes circonstances)
const FALLBACK_ICON_B64 = 'data:image/png;base64,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'

function resolveIcon() {
  const candidates = [
    path.join(process.resourcesPath || '', 'favicon.ico'),
    path.join(process.resourcesPath || '', 'public', 'favicon.ico'),
    path.join(__dirname, '..', 'public', 'favicon.ico'),
    path.join(__dirname, 'public', 'favicon.ico'),
    path.join(app.getAppPath ? app.getAppPath() : '', 'public', 'favicon.ico'),
    path.join(process.cwd(), 'public', 'favicon.ico'),
  ]

  for (const p of candidates) {
    if (p && fs.existsSync(p)) {
      try {
        const img = nativeImage.createFromPath(p)
        if (!img.isEmpty()) {
          console.log(`[RiftVision Overlay] Icône chargée : ${p}`)
          return { image: img, path: p }
        }
      } catch (err) {
        console.warn(`[RiftVision Overlay] Erreur lecture icône (${p}) :`, err.message)
      }
    }
  }

  console.log('[RiftVision Overlay] Utilisation de l’icône native intégrée (Base64).')
  const fallbackImg = nativeImage.createFromDataURL(FALLBACK_ICON_B64)
  return { image: fallbackImg, path: '' }
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
  const { image: trayIcon, path: iconPath } = resolveIcon()
  try {
    tray = new Tray(trayIcon)
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
        label: '⚙️ Options',
        click: () => {
          shell.openExternal(getDashboardUrl())
        },
      },
      {
        label: 'ℹ️ À propos',
        click: () => {
          dialog
            .showMessageBox({
              type: 'info',
              title: 'À propos de RiftVision',
              message: 'RiftVision Overlay — v1.3.0',
              detail:
                'Copilote tactique et HUD in-game transparent pour League of Legends.\n\n' +
                '• Version : 1.3.0\n' +
                '• Auteur : Nabil Labrazi (nabster.dev)\n' +
                '• Dashboard local : ' +
                getDashboardUrl() +
                '\n' +
                '• Statut : Synchronisé localement via Server-Sent Events\n' +
                '• Conforme aux Riot Developer Policies (Live Client Data API)',
              buttons: ['Consulter le Changelog', 'Fermer'],
              defaultId: 1,
              cancelId: 1,
              icon: trayIcon,
            })
            .then(({ response }) => {
              if (response === 0) {
                shell.openExternal(
                  'https://github.com/nlabrazi/riftvision/blob/master/CHANGELOG.md',
                )
              }
            })
            .catch(() => {})
        },
      },
      { type: 'separator' },
      {
        label: '❌ Quitter',
        click: () => {
          app.quit()
        },
      },
    ])

    tray.setContextMenu(contextMenu)
    tray.on('click', () => {
      tray.popUpContextMenu()
    })
    tray.on('double-click', () => {
      shell.openExternal(getDashboardUrl())
    })

    console.log('[RiftVision Overlay] ✓ Icône Tray active dans la barre de notifications.')

    // Notification toast native au démarrage
    if (Notification.isSupported()) {
      new Notification({
        title: 'RiftVision Overlay est actif !',
        body: 'Le compagnon in-game est prêt dans la barre de notifications (près de l’horloge / flèche ^). Faites un clic droit sur l’icône pour accéder aux options ou quitter.',
        icon: iconPath || trayIcon,
      }).show()
    }
  } catch (err) {
    console.error('[RiftVision Overlay] Erreur création Tray :', err)
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
  const { image: appIcon } = resolveIcon()

  overlayWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    title: 'RiftVision Overlay',
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    fullscreen: false,
    skipTaskbar: true,
    icon: appIcon,
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
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.riftvision.overlay')
  }
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
