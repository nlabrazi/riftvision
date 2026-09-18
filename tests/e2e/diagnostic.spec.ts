import { expect, test } from '@playwright/test'
import { mockGameData } from '../../server/data/mockGame'

test.describe('Connection controls and diagnostics', () => {
  test.beforeEach(async ({ page, request }) => {
    await request.post('/api/riot/mock', { data: { enabled: false } })
    const initialStatus = page.waitForResponse((response) =>
      response.url().includes('/api/riot/status'),
    )
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await initialStatus
  })

  test('preserves the brand and Riot disclaimer', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('RiftVision')
    const footer = page.locator('footer').filter({ hasText: "RiftVision isn't endorsed" })
    await expect(footer).toContainText("RiftVision isn't endorsed by Riot Games")
    await expect(footer).toContainText(
      'Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.',
    )
  })

  test('displays portfolio, repository, contact, and X links in footer', async ({ page }) => {
    const footer = page.locator('footer.app-footer')
    await expect(footer).toBeVisible()

    // Portfolio link
    const portfolioLink = footer.locator('a[href="https://nabster.dev"]').first()
    await expect(portfolioLink).toBeVisible()
    await expect(portfolioLink).toContainText('Nabster')

    // GitHub Repo link
    const repoLink = footer.locator('a[href="https://github.com/nlabrazi/riftvision"]')
    await expect(repoLink).toBeVisible()

    // Twitter / X link
    const xLink = footer.locator('a[href="https://x.com/Nabil71405502"]')
    await expect(xLink).toBeVisible()

    // Contact link
    const mailLink = footer.locator('a[href="mailto:na.labrazi@gmail.com"]')
    await expect(mailLink).toBeVisible()
  })

  test('guides the first visit and keeps diagnostics behind help', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'Connecter ma partie', exact: true }),
    ).toHaveCount(1)
    await expect(page.getByRole('button', { name: 'Explorer la démo' })).toHaveCount(1)
    await expect(page.getByTestId('view-map-btn')).toHaveCount(0)
    await expect(page.getByTestId('audio-toggle-btn')).toHaveCount(0)
    await page.getByTestId('view-diagnostic-btn').click()
    await expect(page.getByRole('heading', { name: 'Connecter votre partie' })).toBeVisible()
    await expect(page.getByTestId('tab-overview')).toBeHidden()
    await page.getByText('Diagnostic technique', { exact: false }).click()
    await expect(page.getByTestId('tab-overview')).toBeVisible()
    await expect(page.getByTestId('tab-raw')).toBeVisible()
    await page.getByTestId('close-help-btn').click()
    await expect(page.getByTestId('status-banner')).toContainText('Aucune partie connectée')
    await expect(page.getByTestId('mock-toggle-button')).toBeVisible()
  })

  test('retains simulated players and events in diagnostic tabs', async ({ page }) => {
    const mockButton = page.getByTestId('mock-toggle-button')
    const banner = page.getByTestId('status-banner')
    await mockButton.click()
    await expect(banner).toContainText('Démo · exemple de partie à 16:45')
    await page.getByTestId('view-diagnostic-btn').click()
    await page.getByText('Diagnostic technique', { exact: false }).click()

    await page.getByTestId('tab-players').click()
    await expect(page.getByText('Darius', { exact: true })).toBeVisible()
    await expect(page.getByText('Ahri', { exact: true })).toBeVisible()
    await expect(page.getByText('Garen', { exact: true })).toBeVisible()

    await page.getByTestId('tab-events').click()
    await expect(page.getByText('FirstBlood', { exact: true })).toBeVisible()
    await expect(page.getByText('Chemtech')).toBeVisible()

    await page.getByTestId('close-help-btn').click()
    await mockButton.click()
    await expect(banner).toContainText('Aucune partie connectée')
    await expect(page.getByTestId('scoreboard-header')).toBeHidden()
  })

  test('starts in standby and enables live listening explicitly', async ({ page }) => {
    const banner = page.getByTestId('status-banner')
    const liveButton = page.getByTestId('live-toggle-button')
    await expect(banner).toContainText('Aucune partie connectée')
    await expect(page.getByText('Dernière erreur de connexion', { exact: false })).toHaveCount(0)

    await liveButton.click()
    await expect(liveButton).toContainText('Annuler la recherche')
    await expect(banner).toContainText('Recherche de votre partie')

    await liveButton.click()
    await expect(banner).toContainText('Aucune partie connectée')
  })
})

test('connects a match, makes a paused session recoverable and disconnects', async ({ page }) => {
  let gameAvailable = false
  let snapshots = 0
  await page.route('**/api/riot/status?mock=false', (route) =>
    route.fulfill({
      json: { status: gameAvailable ? 'IN_GAME' : 'DISCONNECTED', isMock: false },
    }),
  )
  await page.route('**/api/riot/live?mock=false', (route) => {
    snapshots++
    return route.fulfill({ json: { success: true, data: mockGameData } })
  })
  const initial = page.waitForResponse((response) => response.url().includes('/api/riot/status'))
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await initial
  gameAvailable = true
  await page.getByRole('button', { name: 'Connecter ma partie', exact: true }).click()
  await expect(page.getByTestId('scoreboard-header')).toBeVisible()
  await expect(page.getByTestId('status-banner')).toContainText('mise à jour automatique')
  await expect(page.getByTestId('mock-toggle-button')).toHaveCount(0)
  await expect(page.getByTestId('polling-toggle-btn')).toHaveCount(0)

  await page.getByTestId('view-diagnostic-btn').click()
  await page.getByText('Diagnostic technique', { exact: false }).click()
  await page.getByRole('button', { name: 'Mettre le suivi en pause' }).click()
  await page.getByTestId('close-help-btn').click()
  await expect(page.getByTestId('status-banner')).toContainText('Suivi en pause')
  const pausedSnapshots = snapshots
  await page.getByRole('button', { name: 'Reprendre le suivi' }).click()
  await expect.poll(() => snapshots).toBeGreaterThan(pausedSnapshots)
  await expect(page.getByTestId('status-banner')).toContainText('mise à jour automatique')

  await page.getByRole('button', { name: 'Déconnecter', exact: true }).click()
  await expect(page.getByTestId('status-banner')).toContainText('Aucune partie connectée')
  await expect(page.getByTestId('scoreboard-header')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Connecter ma partie', exact: true })).toBeVisible()
})
