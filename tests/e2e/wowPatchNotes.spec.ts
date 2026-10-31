import { expect, test } from '@playwright/test'

const sourceUrl = 'https://worldofwarcraft.blizzard.com/fr-fr/content-update-notes'
const articles = Array.from({ length: 31 }, (_, index) => ({
  title: `Notes de mise à jour ${20 - index}`,
  publishedAt: new Date(Date.UTC(2026, 9, 31 - index, 18)).toISOString(),
  description: index === 0 ? 'Un nouveau personnage rejoint la partie.' : null,
  imageUrl:
    index === 0
      ? '/assets/images/game-wow.webp'
      : index === 1
        ? '/assets/images/visuel-absent.png'
        : null,
  url: `https://worldofwarcraft.blizzard.com/fr-fr/news/${100 + index}/notes`,
}))

async function openWow(page: import('@playwright/test').Page) {
  await page.route('**/api/wow/classes', (route) =>
    route.fulfill({ json: { locale: 'fr_FR', edition: 'retail', data: [] } }),
  )
  await page.route('**/api/riot/status?*', (route) =>
    route.fulfill({ json: { status: 'DISCONNECTED', isMock: false, globalMockEnabled: false } }),
  )
  const status = page.waitForResponse((response) => response.url().includes('/api/riot/status'))
  await page.goto('/')
  await status
  await page.locator('.game-card--wow').click()
  await page.getByRole('link', { name: 'Notes de patch', exact: true }).click()
}

test('consulte les notes WoW, recherche et ouvre les liens officiels', async ({ page }) => {
  await page.route('**/api/wow/patch-notes', (route) =>
    route.fulfill({ json: { sourceUrl, articles } }),
  )
  await openWow(page)
  await expect(page).toHaveURL(/\/wow\/patch-notes$/)
  await expect(
    page.getByText('Certains correctifs concernent aussi WoW Classic.', { exact: false }),
  ).toBeVisible()
  await expect(page.locator('.patch-card')).toHaveCount(16)
  await expect(page.locator('.patch-card').first().locator('img')).toHaveAttribute(
    'src',
    '/assets/images/game-wow.webp',
  )
  await expect(page.locator('.patch-card').first()).toContainText(
    'Un nouveau personnage rejoint la partie.',
  )
  await expect(page.locator('.patch-card').nth(1).getByText('Visuel indisponible')).toBeVisible()
  await expect(page.getByRole('link', { name: /Lire les notes officielles.*20/ })).toHaveAttribute(
    'href',
    articles[0].url,
  )
  await page.getByRole('button', { name: 'Suivant →' }).click()
  await expect(page.locator('.patch-card')).toHaveCount(15)
  await expect(page.getByText('Page 2 sur 2')).toBeVisible()
  await page.getByLabel('Rechercher un patch').fill('mise à jour 9')
  await expect(page.locator('.patch-card')).toHaveCount(1)
  await page.getByLabel('Rechercher un patch').fill('absent')
  await expect(page.getByText('Aucune note ne correspond à votre recherche.')).toBeVisible()
  await page.getByRole('button', { name: 'Effacer la recherche' }).click()
  await expect(page.locator('.patch-card')).toHaveCount(16)
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  )
})

test('propose l’archive officielle en cas de panne et permet de réessayer', async ({ page }) => {
  let available = false
  await page.route('**/api/wow/patch-notes', (route) =>
    available
      ? route.fulfill({ json: { sourceUrl, articles } })
      : route.fulfill({ status: 503, json: { statusMessage: 'Indisponible' } }),
  )
  await openWow(page)
  await expect(page.locator('.wow-notice[role="alert"]')).toContainText(
    'momentanément indisponibles',
  )
  await expect(page.getByRole('link', { name: /Ouvrir l’archive officielle/ })).toHaveAttribute(
    'href',
    sourceUrl,
  )
  available = true
  await page.getByRole('button', { name: 'Réessayer' }).click()
  await expect(page.getByRole('heading', { name: 'Notes de mise à jour 20' })).toBeVisible()
})
