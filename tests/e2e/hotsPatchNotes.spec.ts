import { expect, test } from '@playwright/test'

const sourceUrl = 'https://news.blizzard.com/fr-fr/feed/heroes-of-the-storm'
const articles = Array.from({ length: 31 }, (_, index) => ({
  title: `Notes de mise à jour Heroes of the Storm ${index + 1}`,
  updatedAt: new Date(Date.UTC(2026, 9, 31 - index, 18)).toISOString(),
  url: `https://news.blizzard.com/fr-fr/article/${100 + index}/notes-de-mise-a-jour`,
  description: index === 0 ? 'Équilibrage des héros.' : null,
  imageUrl: index === 0 ? '/assets/images/game-hots.webp' : null,
}))

async function openNotes(page: import('@playwright/test').Page) {
  await page.route('**/api/riot/status?*', (route) =>
    route.fulfill({ json: { status: 'DISCONNECTED', isMock: false, globalMockEnabled: false } }),
  )
  const status = page.waitForResponse((response) => response.url().includes('/api/riot/status'))
  await page.goto('/')
  await status
  await page.locator('.game-card--hots').click()
  await page.getByTestId('encyclopedia-action').click()
  await page.getByRole('link', { name: 'Notes de patch', exact: true }).click()
}

test('consulte les notes et leurs couvertures, filtre et navigue dans les pages', async ({
  page,
}) => {
  await page.route('**/api/hots/patch-notes', (route) =>
    route.fulfill({ json: { sourceUrl, articles, truncated: true } }),
  )
  await openNotes(page)
  await expect(page).toHaveURL(/\/hots\/patch-notes$/)
  await expect(page.getByRole('heading', { name: 'Notes de patch.' })).toBeVisible()
  await expect(page.getByText(/120 dernières actualités/)).toBeVisible()
  await expect(page.locator('.patch-card')).toHaveCount(16)
  const first = page.locator('.patch-card').first()
  await expect(first.locator('img')).toHaveAttribute('src', '/assets/images/game-hots.webp')
  await expect(first).toContainText('Mis à jour le')
  await expect(first).toContainText('Équilibrage des héros.')
  await expect(first.getByRole('link', { name: /Lire les notes officielles/ })).toHaveAttribute(
    'href',
    articles[0].url,
  )
  await expect(page.locator('.patch-card').nth(1).getByText('Visuel indisponible')).toBeVisible()
  await page.getByRole('button', { name: 'Suivant →' }).click()
  await expect(page.locator('.patch-card')).toHaveCount(15)
  await page.getByLabel('Rechercher un patch').fill('equilibrage')
  await expect(page.locator('.patch-card')).toHaveCount(1)
  await page.getByLabel('Rechercher un patch').fill('inexistant')
  await expect(page.getByText('Aucune note ne correspond à votre recherche.')).toBeVisible()
  await page.getByRole('button', { name: 'Effacer la recherche' }).click()
  await expect(page.locator('.patch-card')).toHaveCount(16)
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  )
})

test('propose le fil officiel en cas de panne et permet de réessayer', async ({ page }) => {
  let available = false
  await page.route('**/api/hots/patch-notes', (route) =>
    available
      ? route.fulfill({ json: { sourceUrl, articles, truncated: false } })
      : route.fulfill({ status: 503, json: { statusMessage: 'Indisponible' } }),
  )
  await openNotes(page)
  await expect(page.locator('.hots-notice[role="alert"]')).toContainText(
    'momentanément indisponibles',
  )
  await expect(page.getByRole('link', { name: /Ouvrir l’archive officielle/ })).toHaveAttribute(
    'href',
    sourceUrl,
  )
  available = true
  await page.getByRole('button', { name: 'Réessayer' }).click()
  await expect(
    page.getByRole('heading', { name: 'Notes de mise à jour Heroes of the Storm 1', exact: true }),
  ).toBeVisible()
})
