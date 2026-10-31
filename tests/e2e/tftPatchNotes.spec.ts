import { expect, test } from '@playwright/test'

const sourceUrl = 'https://teamfighttactics.leagueoflegends.com/fr-fr/news/tags/patch-notes/'
const articles = Array.from({ length: 31 }, (_, index) => ({
  title: `Notes de patch 18.${21 - index} de TFT`,
  publishedAt: new Date(Date.UTC(2026, 9, 31 - index, 18)).toISOString(),
  url: `https://teamfighttactics.leagueoflegends.com/fr-fr/news/game-updates/teamfight-tactics-patch-18-${21 - index}`,
}))
const champions = {
  version: '16.21.1',
  locale: 'fr_FR',
  data: [{ id: 'DA_Ahri', name: 'Ahri', tier: 3, cost: 3, icon: 'DA_Ahri.png', setNumber: 18 }],
}
async function openTft(page: import('@playwright/test').Page) {
  await page.route('**/api/riot/status?*', (route) =>
    route.fulfill({ json: { status: 'DISCONNECTED', isMock: false, globalMockEnabled: false } }),
  )
  await page.route('**/api/ddragon/tft/champions', (route) => route.fulfill({ json: champions }))
  const status = page.waitForResponse((response) => response.url().includes('/api/riot/status'))
  await page.goto('/')
  await status
  await page.locator('.game-card--tft').click()
  await page.getByRole('link', { name: 'Notes de patch', exact: true }).click()
}

test('consulte les notes TFT, recherche et ouvre les liens officiels', async ({ page }) => {
  await page.route('**/api/tft/patch-notes', (route) =>
    route.fulfill({ json: { sourceUrl, articles } }),
  )
  await openTft(page)
  await expect(page).toHaveURL(/\/tft\/patch-notes$/)
  await expect(page.getByRole('heading', { name: 'Notes de patch.' })).toBeVisible()
  await expect(page.locator('.patch-card')).toHaveCount(16)
  await expect(page.getByText('Dernier patch publié')).toHaveCount(1)
  const first = page.getByRole('link', { name: /Lire les notes officielles.*18.21/ })
  await expect(first).toHaveAttribute('href', articles[0].url)
  await expect(first).toHaveAttribute('target', '_blank')
  await page.getByRole('button', { name: 'Suivant →' }).click()
  await expect(page.locator('.patch-card')).toHaveCount(15)
  await expect(page.getByText('Page 2 sur 2')).toBeVisible()
  await page.getByLabel('Rechercher un patch').fill('18.10')
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

test('propose l’archive officielle TFT en cas de panne et permet de réessayer', async ({
  page,
}) => {
  let available = false
  await page.route('**/api/tft/patch-notes', (route) =>
    available
      ? route.fulfill({ json: { sourceUrl, articles } })
      : route.fulfill({ status: 503, json: { statusMessage: 'Indisponible' } }),
  )
  await openTft(page)
  await expect(page.locator('.tft-notice[role="alert"]')).toContainText(
    'momentanément indisponibles',
  )
  await expect(page.getByRole('link', { name: /Ouvrir l’archive officielle/ })).toHaveAttribute(
    'href',
    sourceUrl,
  )
  available = true
  await page.getByRole('button', { name: 'Réessayer' }).click()
  await expect(page.getByRole('heading', { name: 'Notes de patch 18.21 de TFT' })).toBeVisible()
})
