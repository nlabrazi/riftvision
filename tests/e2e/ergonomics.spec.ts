import { expect, type Page, test } from '@playwright/test'

async function startDemo(page: Page) {
  const initialStatus = page.waitForResponse((response) =>
    response.url().includes('/api/riot/status'),
  )
  await page.goto('/')
  await initialStatus
  await page.getByTestId('mock-toggle-button').click()
  await expect(page.getByTestId('status-banner')).toContainText('Mode Simulation / Mock actif')
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
    await expect(journalToggle).toHaveAttribute('aria-pressed', 'true')
    const initialMapBounds = await page.getByTestId('radar-large-map').boundingBox()
    expect(initialMapBounds).not.toBeNull()

    await journalToggle.click()
    await expect(journal).toBeHidden()
    await expect(journalToggle).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByTestId('radar-large-map')).toBeVisible()
    await expect
      .poll(async () => (await page.getByTestId('radar-large-map').boundingBox())?.width ?? 0)
      .toBeGreaterThan(initialMapBounds?.width ?? 0)

    await journalToggle.click()
    await expect(journal).toBeVisible()
    await expect(journalToggle).toHaveAttribute('aria-pressed', 'true')
  })

  test('returns to a usable waiting screen when the demo stops from the map', async ({ page }) => {
    await startDemo(page)
    await page.getByTestId('view-map-btn').click()
    await expect(page.getByTestId('radar-large-map')).toBeVisible()
    await page.getByTestId('mock-toggle-button').click()

    await expect(page.getByTestId('status-banner')).toContainText(
      'En attente du client League of Legends',
    )
    await expect(page.getByTestId('focus-radar-view')).toBeHidden()
    await expect(page.getByTestId('test-alert-dragon')).toHaveCount(0)
    await expect(page.getByTestId('live-toggle-button')).toBeVisible()
    await expect(page.getByTestId('view-tactical-btn')).toBeVisible()
    await expect(page.getByTestId('view-map-btn')).toBeVisible()

    await page.getByTestId('mock-toggle-button').click()
    await expect(page.getByTestId('status-banner')).toContainText('Mode Simulation / Mock actif')
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
