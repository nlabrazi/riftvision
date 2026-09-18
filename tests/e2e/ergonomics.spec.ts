import { expect, type Page, test } from '@playwright/test'

async function startDemo(page: Page) {
  const initialStatus = page.waitForResponse((response) =>
    response.url().includes('/api/riot/status'),
  )
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await initialStatus
  await page.getByTestId('mock-toggle-button').click()
  await expect(page.getByTestId('status-banner')).toContainText('Démo · exemple de partie à 16:45')
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1)
}

test.describe('Dashboard and immersive map ergonomics', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/riot/mock', { data: { enabled: false } })
  })

  for (const viewport of [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'tablet', width: 1024, height: 768 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    test(`keeps both views usable on ${viewport.name} without horizontal scrolling`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await startDemo(page)
      await expect(page.getByTestId('tactical-minimap')).toBeVisible()
      await expect(page.getByTestId('live-diff-feed')).toBeVisible()
      await expectNoHorizontalOverflow(page)
      await expect(page.getByTestId('view-map-btn')).toBeInViewport()

      await page.getByTestId('view-map-btn').click()
      await expect(page.getByTestId('focus-radar-view')).toBeVisible()
      await expect(page.getByTestId('radar-large-map')).toBeVisible()
      await expectNoHorizontalOverflow(page)
      await expect(page.getByTestId('view-tactical-btn')).toBeInViewport()

      await page.getByTestId('view-tactical-btn').click()
      await expect(page.getByTestId('scoreboard-header')).toBeVisible()
    })
  }

  test('shows the map and combat log together without scrolling on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await startDemo(page)
    await expect(page.getByTestId('scoreboard-header')).toBeInViewport()
    await expect(page.getByTestId('tactical-minimap')).toBeInViewport({ ratio: 0.8 })
    await expect(page.getByTestId('live-diff-feed')).toBeInViewport({ ratio: 0.8 })
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })

  test('can hide and restore the immersive journal', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await startDemo(page)
    await page.getByTestId('view-map-btn').click()

    const journalToggle = page.getByTestId('radar-journal-toggle')
    const journal = page.getByTestId('radar-alert-panel')
    await expect(journal).toBeVisible()
    await expect(journalToggle).toHaveAttribute('aria-expanded', 'true')
    const initialMapBounds = await page.getByTestId('radar-large-map').boundingBox()
    expect(initialMapBounds).not.toBeNull()

    await journalToggle.click()
    await expect(journal).toBeHidden()
    await expect(journalToggle).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('radar-large-map')).toBeVisible()
    await expect
      .poll(async () => (await page.getByTestId('radar-large-map').boundingBox())?.width ?? 0)
      .toBeGreaterThan(initialMapBounds?.width ?? 0)

    await journalToggle.click()
    await expect(journal).toBeVisible()
    await expect(journalToggle).toHaveAttribute('aria-expanded', 'true')
  })

  test('returns to a usable waiting screen when the demo stops from the map', async ({ page }) => {
    await startDemo(page)
    await page.getByTestId('view-map-btn').click()
    await expect(page.getByTestId('radar-large-map')).toBeVisible()
    await page.getByTestId('mock-toggle-button').click()

    await expect(page.getByTestId('status-banner')).toContainText('Aucune partie connectée')
    await expect(page.getByTestId('focus-radar-view')).toBeHidden()
    await expect(page.getByTestId('test-alert-dragon')).toHaveCount(0)
    await expect(page.getByTestId('live-toggle-button')).toBeVisible()
    await expect(page.getByTestId('view-tactical-btn')).toHaveCount(0)
    await expect(page.getByTestId('view-map-btn')).toHaveCount(0)

    await page.getByTestId('mock-toggle-button').click()
    await expect(page.getByTestId('status-banner')).toContainText(
      'Démo · exemple de partie à 16:45',
    )
    await page.getByTestId('view-map-btn').click()
    await expect(page.getByTestId('radar-large-map')).toBeVisible()
  })

  test('enters and exits fullscreen using the control and Escape', async ({ page }) => {
    await startDemo(page)
    await page.getByTestId('view-map-btn').click()
    test.skip(
      !(await page.evaluate(() => document.fullscreenEnabled)),
      'This browser does not support fullscreen',
    )

    const fullscreenButton = page.getByTestId('fullscreen-btn')
    await fullscreenButton.click()
    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true)
    await expect(page.getByTestId('radar-large-map')).toBeInViewport()
    await fullscreenButton.click()
    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false)

    await fullscreenButton.click()
    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true)
    await page.keyboard.press('Escape')
    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false)
    await expect(page.getByTestId('view-tactical-btn')).toBeVisible()
  })
})

test.describe('Guided navigation', () => {
  test('keeps the same journal context when enlarging the map, hiding the journal and visiting help', async ({
    page,
  }) => {
    await startDemo(page)
    const journal = page.getByTestId('live-diff-feed')
    await journal.getByRole('button', { name: 'Objectifs', exact: true }).click()
    await journal.getByRole('searchbox').fill('dragon')
    await journal.getByTestId('combat-log-event').click()
    await page.getByTestId('view-map-btn').click()
    await expect(journal.getByRole('searchbox')).toHaveValue('dragon')
    await expect(journal.getByRole('button', { name: 'Objectifs', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.getByTestId('map-selected-event')).toBeVisible()
    await page.getByTestId('radar-journal-toggle').click()
    await page.getByTestId('radar-journal-toggle').click()
    await expect(journal.getByRole('searchbox')).toHaveValue('dragon')
    await page.getByTestId('view-diagnostic-btn').click()
    await page.getByTestId('close-help-btn').click()
    await expect(page.getByTestId('focus-radar-view')).toBeVisible()
    await expect(journal.getByRole('searchbox')).toHaveValue('dragon')
    await expect(page.getByTestId('map-selected-event')).toBeVisible()
    await page.getByTestId('view-tactical-btn').click()
    await expect(journal.getByTestId('combat-log-event')).toHaveCount(1)
    await expect(page.getByTestId('map-selected-event')).toBeVisible()
  })

  test('offers a way out of an empty search and resets the journal for a new demo', async ({
    page,
  }) => {
    await startDemo(page)
    const journal = page.getByTestId('live-diff-feed')
    await journal.getByRole('button', { name: 'Objectifs', exact: true }).click()
    await journal.getByRole('searchbox').fill('introuvable')
    await journal.getByRole('button', { name: 'Réinitialiser les filtres' }).click()
    await expect(journal.getByRole('searchbox')).toHaveValue('')
    await expect(journal.getByRole('button', { name: 'Tous', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await journal.getByRole('searchbox').fill('dragon')
    await page.getByTestId('mock-toggle-button').click()
    await page.getByTestId('mock-toggle-button').click()
    await expect(journal.getByRole('searchbox')).toHaveValue('')
    await expect(journal).toContainText('Exemple')
    await expect(page.getByTestId('polling-toggle-btn')).toHaveCount(0)
  })

  test('shows audio controls only once, including in fullscreen', async ({ page }) => {
    await startDemo(page)
    await page.getByTestId('view-map-btn').click()
    const audio = page.getByRole('button', { name: /les alertes sonores/ })
    await expect(audio).toHaveCount(1)
    await expect(page.getByTestId('radar-audio-toggle')).toHaveCount(0)
    test.skip(!(await page.evaluate(() => document.fullscreenEnabled)), 'Fullscreen unavailable')
    await page.getByTestId('fullscreen-btn').click()
    await expect(page.getByTestId('radar-audio-toggle')).toBeInViewport()
    await page.getByTestId('radar-audio-toggle').click()
    await page.getByTestId('fullscreen-btn').click()
    await expect(page.getByTestId('audio-toggle-btn')).toContainText('Son coupé')
    await expect(page.getByTestId('radar-audio-toggle')).toHaveCount(0)
  })
})
