import { expect, test } from '@playwright/test'

const maps = {
  locale: 'fr-FR',
  data: [
    {
      id: '7eaecc1b-4337-bbf6-6ab9-04b8f06b3319',
      name: 'Ascent',
      splash: 'https://media.valorant-api.com/maps/ascent/splash.png',
      minimap: 'https://media.valorant-api.com/maps/ascent/plan.png',
      tacticalDescription: 'Sites A/B',
      narrativeDescription: null,
      callouts: [{ region: 'Tree', area: 'A' }],
    },
    {
      id: 'ee613ee9-28b7-4beb-9666-08db13bb2244',
      name: 'Entraînement',
      splash: null,
      minimap: null,
      tacticalDescription: null,
      narrativeDescription: null,
      callouts: [],
    },
    {
      id: 'ee613ee9-28b7-4beb-9666-08db13bb2245',
      name: 'Entraînement',
      splash: null,
      minimap: null,
      tacticalDescription: null,
      narrativeDescription: null,
      callouts: [],
    },
  ],
}
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
async function openHome(page: import('@playwright/test').Page) {
  const status = page.waitForResponse((response) => response.url().includes('/api/riot/status'))
  await page.goto('/')
  await status
}

test('recherche une carte et consulte son plan et ses zones', async ({ page }) => {
  await page.route('**/api/valorant/agents', (route) => route.fulfill({ json: agents }))
  await page.route('**/api/valorant/maps', (route) => route.fulfill({ json: maps }))
  await openHome(page)
  await page.locator('.game-card--valorant').click()
  await page.getByRole('link', { name: 'Cartes Valorant', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Les cartes Valorant.' })).toBeVisible()
  await expect(page.getByText(/n’indique pas la rotation actuelle/)).toBeVisible()
  await expect(page.getByText('3 cartes', { exact: true })).toBeVisible()
  await page.getByLabel('Rechercher une carte').fill('ascent')
  await expect(page.getByText('1 carte', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: /Ascent/ }).click()
  await expect(page.getByRole('heading', { name: 'Ascent' })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Plan de Ascent' })).toBeVisible()
  await expect(page.getByRole('listitem').filter({ hasText: 'Tree' })).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  )
  await page.getByRole('link', { name: '← Retour aux cartes Valorant' }).click()
  await page.getByLabel('Rechercher une carte').fill('entrainement')
  await expect(page.getByText('2 cartes', { exact: true })).toBeVisible()
  await page
    .getByRole('link', { name: /Entraînement.*ee613ee9-28b7-4beb-9666-08db13bb2244/ })
    .click()
  await expect(page.getByText('Le plan n’est pas disponible pour cette carte.')).toBeVisible()
  await expect(
    page.getByText('Les noms de zones ne sont pas disponibles pour cette carte.'),
  ).toBeVisible()
})

test('gère les résultats vides et une indisponibilité du catalogue des cartes', async ({
  page,
}) => {
  let available = false
  await page.route('**/api/valorant/agents', (route) => route.fulfill({ json: agents }))
  await page.route('**/api/valorant/maps', (route) =>
    available
      ? route.fulfill({ json: maps })
      : route.fulfill({ status: 503, json: { statusMessage: 'Indisponible' } }),
  )
  await openHome(page)
  await page.locator('.game-card--valorant').click()
  await page.getByRole('link', { name: 'Cartes Valorant', exact: true }).click()
  await expect(page.locator('.val-notice[role="alert"]')).toContainText(
    'momentanément indisponible',
  )
  available = true
  await page.getByRole('button', { name: 'Réessayer' }).click()
  await page.getByLabel('Rechercher une carte').fill('introuvable')
  await expect(page.getByText('Aucune carte ne correspond à votre recherche.')).toBeVisible()
  await page.getByRole('button', { name: 'Effacer la recherche' }).click()
  await expect(page.getByText('3 cartes', { exact: true })).toBeVisible()
})
