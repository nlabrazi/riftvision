import { expect, test } from '@playwright/test'

const sourceUrl = 'https://playvalorant.com/fr-fr/news/tags/patch-notes/'
const articles = Array.from({ length: 31 }, (_, index) => ({
  title: `Notes de patch 13.${21 - index} VALORANT`,
  publishedAt: new Date(Date.UTC(2026, 9, 31 - index, 18)).toISOString(),
  url: `https://playvalorant.com/fr-fr/news/game-updates/valorant-patch-notes-13-${21 - index}`,
}))
const agents = {
  locale: 'fr-FR',
  data: [
    {
      id: 'e370fa57-4757-3604-3648-499e1f642d3f',
      name: 'Gekko',
      description: '',
      role: 'Initiateur',
      icon: 'https://media.valorant-api.com/gekko.png',
      portrait: null,
      abilities: [],
    },
  ],
}
async function openValorant(page: import('@playwright/test').Page) {
  await page.route('**/api/riot/status?*', (route) =>
    route.fulfill({ json: { status: 'DISCONNECTED', isMock: false, globalMockEnabled: false } }),
  )
  await page.route('**/api/valorant/agents', (route) => route.fulfill({ json: agents }))
  const status = page.waitForResponse((response) => response.url().includes('/api/riot/status'))
  await page.goto('/')
  await status
  await page.locator('.game-card--valorant').click()
  await page.getByRole('link', { name: 'Notes de patch', exact: true }).click()
}

test('consulte les notes Valorant, recherche et ouvre les liens officiels', async ({ page }) => {
  await page.route('**/api/valorant/patch-notes', (route) =>
    route.fulfill({ json: { sourceUrl, articles } }),
  )
  await openValorant(page)
  await expect(page).toHaveURL(/\/valorant\/patch-notes$/)
  await expect(page.getByRole('heading', { name: 'Notes de patch.' })).toBeVisible()
  await expect(page.locator('.patch-card')).toHaveCount(16)
  await expect(page.getByText('Dernier patch publié')).toHaveCount(1)
  const first = page.getByRole('link', { name: /Lire les notes officielles.*13.21/ })
  await expect(first).toHaveAttribute('href', articles[0].url)
  await expect(first).toHaveAttribute('target', '_blank')
  await page.getByRole('button', { name: 'Suivant →' }).click()
  await expect(page.locator('.patch-card')).toHaveCount(15)
  await expect(page.getByText('Page 2 sur 2')).toBeVisible()
  await page.getByLabel('Rechercher un patch').fill('13.10')
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

test('propose l’archive officielle Valorant en cas de panne et permet de réessayer', async ({
  page,
}) => {
  let available = false
  await page.route('**/api/valorant/patch-notes', (route) =>
    available
      ? route.fulfill({ json: { sourceUrl, articles } })
      : route.fulfill({ status: 503, json: { statusMessage: 'Indisponible' } }),
  )
  await openValorant(page)
  await expect(page.locator('.val-notice[role="alert"]')).toContainText(
    'momentanément indisponibles',
  )
  await expect(page.getByRole('link', { name: /Ouvrir l’archive officielle/ })).toHaveAttribute(
    'href',
    sourceUrl,
  )
  available = true
  await page.getByRole('button', { name: 'Réessayer' }).click()
  await expect(page.getByRole('heading', { name: 'Notes de patch 13.21 VALORANT' })).toBeVisible()
})
