import { expect, test } from '@playwright/test'

const sourceUrl = 'https://www.leagueoflegends.com/fr-fr/news/tags/patch-notes/'
const articles = Array.from({ length: 31 }, (_, index) => ({
  title: `Notes de patch 26.${21 - index}`,
  publishedAt: new Date(Date.UTC(2026, 9, 31 - index, 18)).toISOString(),
  url: `https://www.leagueoflegends.com/fr-fr/news/game-updates/patch-26-${21 - index}-notes`,
}))

async function openLeague(page: import('@playwright/test').Page) {
  await page.route('**/api/riot/status?*', (route) =>
    route.fulfill({ json: { status: 'DISCONNECTED', isMock: false, globalMockEnabled: false } }),
  )
  const status = page.waitForResponse((response) => response.url().includes('/api/riot/status'))
  await page.goto('/league')
  await status
}

test('consulte les notes officielles et recherche dans l’historique', async ({ page }) => {
  await page.route('**/api/patch-notes', (route) =>
    route.fulfill({ json: { sourceUrl, articles } }),
  )
  await openLeague(page)
  await page.getByRole('link', { name: /Notes de patch.*Retrouvez/ }).click()
  await expect(page).toHaveURL(/\/league\/patch-notes$/)
  await expect(page.getByRole('heading', { name: 'Notes de patch.' })).toBeVisible()
  await expect(page.locator('.patch-card')).toHaveCount(16)
  await expect(page.getByText('Dernier patch publié')).toHaveCount(1)
  const firstLink = page.getByRole('link', { name: /Lire les notes officielles.*26.21/ })
  await expect(firstLink).toHaveAttribute('href', articles[0].url)
  await expect(firstLink).toHaveAttribute('target', '_blank')
  await page.getByRole('button', { name: 'Suivant →' }).click()
  await expect(page.locator('.patch-card')).toHaveCount(15)
  await expect(page.getByText('Page 2 sur 2')).toBeVisible()
  await page.getByLabel('Rechercher un patch').fill('26.10')
  await expect(page.locator('.patch-card')).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'Notes de patch 26.10' })).toBeVisible()
  await page.getByLabel('Rechercher un patch').fill('absent')
  await expect(page.getByText('Aucune note ne correspond à votre recherche.')).toBeVisible()
  await page.getByRole('button', { name: 'Effacer la recherche' }).click()
  await expect(page.locator('.patch-card')).toHaveCount(16)
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  )
})

test('propose l’archive officielle quand la source est indisponible', async ({ page }) => {
  let available = false
  await page.route('**/api/patch-notes', (route) =>
    available
      ? route.fulfill({ json: { sourceUrl, articles } })
      : route.fulfill({ status: 503, json: { statusMessage: 'Indisponible' } }),
  )
  await openLeague(page)
  await page.getByRole('link', { name: /Notes de patch.*Retrouvez/ }).click()
  await expect(page.locator('.encyclopedia-notice[role="alert"]')).toContainText(
    'momentanément indisponibles',
  )
  await expect(page.getByRole('link', { name: /Ouvrir l’archive officielle/ })).toHaveAttribute(
    'href',
    sourceUrl,
  )
  available = true
  await page.getByRole('button', { name: 'Réessayer' }).click()
  await expect(page.getByRole('heading', { name: 'Notes de patch 26.21' })).toBeVisible()
})
