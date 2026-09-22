import { expect, test } from '@playwright/test'
import { mockGameData } from '../../server/data/mockGame'

test.describe('Network resilience and error handling', () => {
  test('handles 500 server error on initial status without crashing', async ({ page }) => {
    // Intercept status endpoint to simulate an API breakdown
    await page.route('**/api/riot/status*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Riot Service Unavailable' }),
      })
    })

    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // Page must render its main structure cleanly
    await expect(page.getByRole('heading', { level: 1 })).toContainText('RiftVision')
    await expect(page.getByTestId('status-banner')).toContainText('Aucune partie connectée')

    // Standby guidance must remain accessible
    await expect(page.getByRole('button', { name: 'Connecter ma partie' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Explorer la démo' })).toBeVisible()
  })

  test('displays connection error and retains current data when live fetch fails during match', async ({
    page,
    request,
  }) => {
    // Start with a clean state and enable mock mode
    await request.post('/api/riot/mock', { data: { enabled: false } })
    const initialStatus = page.waitForResponse((res) => res.url().includes('/api/riot/status'))
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await initialStatus

    // Start demo
    await page.getByTestId('mock-toggle-button').click()
    await expect(page.getByTestId('status-banner')).toContainText(
      'Démo · exemple de partie à 16:45',
    )
    await expect(page.getByTestId('scoreboard-header')).toBeVisible()

    // Now open diagnostic panel
    await page.getByTestId('view-diagnostic-btn').click()
    await page.getByText('Diagnostic technique', { exact: false }).click()

    // Intercept subsequent /api/riot/status to simulate connection drop with error
    await page.route('**/api/riot/status*', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Connexion perdue avec le client Riot' }),
      })
    })

    // Click refresh connection in diagnostic panel
    await page.getByRole('button', { name: /Vérifier la connexion/ }).click()

    // Verify error message is surfaced in diagnostic panel
    await expect(page.locator('.connection-error')).toBeVisible()
    await expect(page.locator('.connection-error')).toContainText('503 Service Unavailable')

    // Close help and verify data was NOT lost / dashboard is still operational
    await page.getByTestId('close-help-btn').click()
    await expect(page.getByTestId('scoreboard-header')).toBeVisible()
    await expect(page.getByTestId('blue-team-column')).toBeVisible()
  })

  test('dynamically ingests fresh live events and updates scoreboard and combat log in real-time', async ({
    page,
  }) => {
    let callCount = 0
    // Snapshot 1: base mock game data (Darius has 3 kills)
    const snapshot1 = JSON.parse(JSON.stringify(mockGameData))

    // Snapshot 2: Darius gets a new kill on Garen (+1 kill, new event in Events list)
    const snapshot2 = JSON.parse(JSON.stringify(mockGameData))
    snapshot2.activePlayer.currentGold += 300
    const darius = snapshot2.allPlayers.find(
      (p: (typeof mockGameData.allPlayers)[number]) => p.championName === 'Darius',
    )
    if (darius) {
      darius.scores.kills = 4
    }
    const newKillEvent = {
      EventID: 9999,
      EventName: 'ChampionKill',
      EventTime: 1020.0,
      KillerName: 'DariusMaster#EUW',
      VictimName: 'GarenPlayer#EUW',
      Assisters: [],
    }
    snapshot2.events.Events.push(newKillEvent)

    // Route status to report an active live game (not mock)
    await page.route('**/api/riot/status*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'IN_GAME',
          isMock: false,
          gameTime: 1005.5,
        }),
      })
    })

    // Route live to return snapshot1 on first call, snapshot2 on second call
    await page.route('**/api/riot/live*', async (route) => {
      callCount++
      const dataToReturn = callCount === 1 ? snapshot1 : snapshot2
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: dataToReturn,
        }),
      })
    })

    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // Click connect to live match
    await page.getByRole('button', { name: 'Connecter ma partie' }).click()

    // Verify match is connected
    await expect(page.getByTestId('scoreboard-header')).toBeVisible()
    await expect(page.getByTestId('status-banner')).toContainText(
      'Partie connectée · mise à jour automatique',
    )

    // Open diagnostic drawer to trigger manual refresh (which triggers live call #2)
    await page.getByTestId('view-diagnostic-btn').click()
    await page.getByText('Diagnostic technique', { exact: false }).click()
    await page.getByRole('button', { name: /Vérifier la connexion/ }).click()

    // Close help to return to tactical dashboard
    await page.getByTestId('close-help-btn').click()

    // Verify the newly ingested event triggered a flash alert
    const overlay = page.getByTestId('flash-alert-overlay')
    await expect(overlay).toBeVisible()
    await expect(overlay).toContainText(/darius/i)
    await expect(overlay).toContainText(/garen/i)

    // Verify combat log contains the new event
    const journal = page.getByTestId('live-diff-feed')
    await expect(journal).toBeVisible()
    await expect(journal).toContainText(/darius/i)
  })
})
