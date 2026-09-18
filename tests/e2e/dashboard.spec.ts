import { expect, test } from '@playwright/test'

test.describe('Tactical Dashboard & Team Economy View', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/riot/mock', {
      data: { enabled: false },
    })
  })

  test('renders tactical dashboard with side-by-side teams and scoreboard', async ({ page }) => {
    // Wait for the client-side initial fetchStatus to guarantee Vue hydration
    const initialStatusPromise = page.waitForResponse((res) =>
      res.url().includes('/api/riot/status'),
    )
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await initialStatusPromise

    // Toggle mock mode to activate game data
    const mockBtn = page.locator('[data-testid="mock-toggle-button"]')
    await expect(mockBtn).toBeVisible()
    await mockBtn.click()

    // Verify mock mode is active
    const banner = page.locator('[data-testid="status-banner"]')
    await expect(banner).toContainText('Démo · exemple de partie à 16:45')

    // Verify Scoreboard Header is displayed
    const scoreboard = page.locator('[data-testid="scoreboard-header"]')
    await expect(scoreboard).toBeVisible()
    await expect(scoreboard).toContainText('Équipe Bleue')
    await expect(scoreboard).toContainText('Équipe Rouge')

    // Verify Blue Team column & champions
    const blueTeam = page.locator('[data-testid="blue-team-column"]')
    await expect(blueTeam).toBeVisible()
    await expect(blueTeam.getByText('Darius', { exact: true })).toBeVisible()
    await expect(blueTeam.getByText('Ahri', { exact: true })).toBeVisible()
    await expect(blueTeam.getByText('Jinx', { exact: true })).toBeVisible()

    // Verify Red Team column & champions
    const redTeam = page.locator('[data-testid="red-team-column"]')
    await expect(redTeam).toBeVisible()
    await expect(redTeam.getByText('Garen', { exact: true })).toBeVisible()
    await expect(redTeam.getByText('Zed', { exact: true })).toBeVisible()
    await expect(redTeam.getByText('Nautilus', { exact: true })).toBeVisible()

    // Verify Live Diff Event Feed is rendered
    const diffFeed = page.locator('[data-testid="live-diff-feed"]')
    await expect(diffFeed).toBeVisible()
    await expect(diffFeed).toContainText('Journal de combat')
  })

  test('switches smoothly between Tactical Dashboard and Diagnostic Console', async ({ page }) => {
    // Wait for the client-side initial fetchStatus to guarantee Vue hydration
    const initialStatusPromise = page.waitForResponse((res) =>
      res.url().includes('/api/riot/status'),
    )
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await initialStatusPromise

    // Toggle mock mode
    const mockBtn = page.locator('[data-testid="mock-toggle-button"]')
    await expect(mockBtn).toBeVisible()
    await mockBtn.click()

    // Verify mock mode is active
    const banner = page.locator('[data-testid="status-banner"]')
    await expect(banner).toContainText('Démo · exemple de partie à 16:45')

    // Switch to Diagnostic API view
    await page.locator('[data-testid="view-diagnostic-btn"]').click()
    await page.getByText('Diagnostic technique', { exact: false }).click()

    // Verify diagnostic tabs are rendered
    await expect(page.locator('[data-testid="tab-overview"]')).toBeVisible()
    await expect(page.locator('[data-testid="tab-raw"]')).toBeVisible()

    // Return to the same match from help
    await page.getByTestId('close-help-btn').click()
    await expect(page.locator('[data-testid="scoreboard-header"]')).toBeVisible()
  })

  test('keeps the map visible and opens the immersive view', async ({ page }) => {
    const initialStatus = page.waitForResponse((res) => res.url().includes('/api/riot/status'))
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await initialStatus
    await expect(page.getByTestId('view-map-btn')).toHaveCount(0)
    await page.getByTestId('mock-toggle-button').click()
    const minimap = page.getByTestId('tactical-minimap')
    await expect(minimap).toBeVisible()
    await expect(page.getByTestId('champion-map-pin')).toHaveCount(10)
    await expect(page.getByTestId('baron-pit-marker')).toBeVisible()
    await expect(page.getByTestId('dragon-pit-marker')).toBeVisible()
    await expect(page.getByTestId('turret-pin').first()).toBeVisible()
    await page.getByTestId('view-map-btn').click()
    await expect(page.getByTestId('focus-radar-view')).toBeVisible()
    await expect(minimap).toBeVisible()
    await page.getByTestId('view-tactical-btn').click()
    await expect(page.getByTestId('scoreboard-header')).toBeVisible()
    await expect(minimap).toBeVisible()
  })

  test('filters the journal, searches and locates an objective without replaying alerts', async ({
    page,
  }) => {
    const initialStatus = page.waitForResponse((res) => res.url().includes('/api/riot/status'))
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await initialStatus
    await page.getByTestId('mock-toggle-button').click()
    const journal = page.getByTestId('live-diff-feed')
    await expect(journal.getByTestId('combat-log-event').first()).toContainText('16:45')
    await journal.getByRole('button', { name: 'Objectifs', exact: true }).click()
    await journal.getByRole('searchbox').fill('dragon')
    const dragonEvent = journal.getByTestId('combat-log-event')
    await expect(dragonEvent).toHaveCount(1)
    await expect(dragonEvent).toContainText('Dragon Chemtech')
    await dragonEvent.click()
    await expect(page.getByTestId('map-selected-event')).toContainText('Journal')
    await expect(page.getByTestId('flash-alert-overlay')).toHaveCount(0)
    await page.getByRole('button', { name: "Désélectionner l'événement" }).click()
    await expect(page.getByTestId('map-selected-event')).toHaveCount(0)
    await journal.getByRole('searchbox').fill('introuvable')
    await expect(journal).toContainText('Aucun événement correspondant')
  })

  test('opens champion details with the keyboard and clears them with Escape', async ({ page }) => {
    const initialStatus = page.waitForResponse((res) => res.url().includes('/api/riot/status'))
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await initialStatus
    await page.getByTestId('mock-toggle-button').click()
    const champion = page.getByTestId('champion-map-pin').first()
    await champion.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('champion-map-details')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('champion-map-details')).toHaveCount(0)
  })
})
