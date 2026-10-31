import { expect, test } from '@playwright/test'

const gekko = {
  id: 'e370fa57-4757-3604-3648-499e1f642d3f',
  name: 'Gekko',
  description: 'Originaire de Los Angeles.',
  role: 'Initiateur',
  icon: 'https://media.valorant-api.com/gekko.png',
  portrait: null,
  abilities: [
    {
      slot: 'Ultimate',
      name: 'Mordicus',
      description: 'TIREZ pour prendre le contrôle.',
      icon: null,
    },
  ],
}
const sage = {
  id: '569fdd95-4d10-43ab-ca70-79becc718b46',
  name: 'Sage',
  description: 'Une sentinelle.',
  role: 'Sentinelle',
  icon: 'https://media.valorant-api.com/sage.png',
  portrait: null,
  abilities: [],
}
const data = { locale: 'fr-FR', data: [gekko, sage] }

async function openHome(page: import('@playwright/test').Page) {
  await page.route('**/api/riot/status?*', (route) =>
    route.fulfill({ json: { status: 'DISCONNECTED', isMock: false, globalMockEnabled: false } }),
  )
  const status = page.waitForResponse((response) => response.url().includes('/api/riot/status'))
  await page.goto('/')
  await status
}

test('explore les agents Valorant et consulte leurs compétences', async ({ page }) => {
  await page.route('**/api/valorant/agents', (route) => route.fulfill({ json: data }))
  await openHome(page)
  await page.locator('.game-card--valorant').click()
  await expect(page).toHaveURL(/\/valorant$/)
  await expect(page.getByRole('heading', { name: 'Les agents Valorant.' })).toBeVisible()
  await expect(page.getByText('2 agents', { exact: true })).toBeVisible()
  await page.getByRole('combobox', { name: 'Rôle', exact: true }).selectOption('Initiateur')
  await page.getByLabel('Rechercher un agent').fill('gek')
  await expect(page.getByText('1 agent', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: /Gekko.*Initiateur/ }).click()
  await expect(page.getByRole('heading', { name: 'Gekko' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Mordicus' })).toBeVisible()
  await expect(page.getByText('Ultime', { exact: true })).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  )
  await page.getByRole('link', { name: '← Retour aux agents Valorant' }).click()
  await page.getByLabel('Rechercher un agent').fill('absent')
  await expect(page.getByText('Aucun agent ne correspond à votre recherche.')).toBeVisible()
  await page.getByRole('button', { name: 'Effacer les filtres' }).click()
  await expect(page.getByText('2 agents', { exact: true })).toBeVisible()
})

test('permet de réessayer après une indisponibilité et affiche un agent introuvable', async ({
  page,
}) => {
  let available = false
  await page.route('**/api/valorant/agents', (route) =>
    available
      ? route.fulfill({ json: data })
      : route.fulfill({ status: 503, json: { statusMessage: 'Indisponible' } }),
  )
  await openHome(page)
  await page.locator('.game-card--valorant').click()
  await expect(page.locator('.val-notice[role="alert"]')).toContainText(
    'momentanément indisponible',
  )
  available = true
  await page.getByRole('button', { name: 'Réessayer' }).click()
  await expect(page.getByText('2 agents', { exact: true })).toBeVisible()
  await page.goto('/valorant/agents/inconnu')
  await expect(page.locator('.val-notice[role="alert"]')).toContainText('Cet agent est introuvable')
})
