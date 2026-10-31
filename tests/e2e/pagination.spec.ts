import { expect, test } from '@playwright/test'

const version = '16.21.1'

async function openHome(page: import('@playwright/test').Page) {
  await page.route('**/api/riot/status?*', (route) =>
    route.fulfill({ json: { status: 'DISCONNECTED', isMock: false, globalMockEnabled: false } }),
  )
  const status = page.waitForResponse((response) => response.url().includes('/api/riot/status'))
  await page.goto('/')
  await status
}

test('pagine les champions et réinitialise la page avec les filtres', async ({ page }) => {
  const champions = Object.fromEntries(
    Array.from({ length: 100 }, (_, index) => {
      const number = String(index + 1).padStart(3, '0')
      return [
        number,
        {
          id: number,
          name: `Champion ${number}`,
          title: 'Titre',
          tags: index < 50 ? ['Mage'] : ['Tank'],
        },
      ]
    }),
  )
  await page.route('**/api/ddragon/champions', (route) =>
    route.fulfill({ json: { version, locale: 'fr_FR', data: champions } }),
  )
  await openHome(page)
  await page.locator('.game-card--league').click()
  await page.getByRole('link', { name: /Champions.*Recherchez/ }).click()
  const pagination = page.getByRole('navigation', { name: 'Pagination des résultats' })
  await expect(page.locator('.champion-card')).toHaveCount(34)
  await expect(pagination).toContainText('Page 1 sur 3')
  await expect(pagination.getByRole('button', { name: /Précédent/ })).toBeDisabled()
  await pagination.getByRole('button', { name: /Suivant/ }).click()
  await expect(page.locator('#catalog-results')).toBeFocused()
  await expect(page.getByRole('link', { name: /Champion 035/ })).toBeVisible()
  await pagination.getByLabel('Aller à la page').selectOption('3')
  await expect(page.locator('.champion-card')).toHaveCount(32)
  await expect(pagination.getByRole('button', { name: /Suivant/ })).toBeDisabled()
  await pagination.getByRole('button', { name: /Précédent/ }).click()
  await expect(pagination).toContainText('Page 2 sur 3')
  await page.getByLabel('Classe').selectOption('Mage')
  await expect(pagination).toContainText('Page 1 sur 2')
  await expect(page.getByRole('link', { name: /Champion 001/ })).toBeVisible()
  await page.getByLabel('Rechercher un champion').fill('Champion 050')
  await expect(page.getByRole('link', { name: /Champion 050/ })).toBeVisible()
  await expect(pagination).toHaveCount(0)
  await page.getByLabel('Rechercher un champion').fill('absent')
  await expect(page.getByText('Aucun champion ne correspond à votre recherche.')).toBeVisible()
  await page.getByRole('button', { name: 'Effacer les filtres' }).click()
  await expect(pagination).toContainText('Page 1 sur 3')
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  )
})

test('pagine les objets LoL et conserve la recherche sur tout le catalogue', async ({ page }) => {
  const items = Array.from({ length: 65 }, (_, index) => ({
    id: String(index + 1),
    name: `Objet ${String(index + 1).padStart(2, '0')}`,
    icon: '1001.png',
    summary: 'Test',
    description: '',
    totalGold: 300,
    sellGold: 200,
    tags: ['Boots'],
    from: [],
    into: [],
  }))
  await page.route('**/api/ddragon/items', (route) =>
    route.fulfill({ json: { version, locale: 'fr_FR', data: items } }),
  )
  await openHome(page)
  await page.locator('.game-card--league').click()
  await page.getByRole('link', { name: 'Objets →' }).click()
  await expect(page.locator('.collection-card')).toHaveCount(33)
  await page.getByRole('button', { name: /Suivant/ }).click()
  await expect(page.getByRole('link', { name: /Objet 34/ })).toBeVisible()
  await page.getByLabel('Rechercher un objet').fill('Objet 65')
  await expect(page.getByRole('link', { name: /Objet 65/ })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Pagination des résultats' })).toHaveCount(0)
})

test('pagine les traits TFT et filtre au-delà de la première page', async ({ page }) => {
  const traits = Array.from({ length: 65 }, (_, index) => ({
    id: `trait${index}`,
    name: `Trait ${String(index + 1).padStart(2, '0')}`,
    icon: 'trait.png',
  }))
  await page.route('**/api/ddragon/tft/champions', (route) =>
    route.fulfill({ json: { version, locale: 'fr_FR', data: [] } }),
  )
  await page.route('**/api/ddragon/tft/traits', (route) =>
    route.fulfill({ json: { version, locale: 'fr_FR', data: traits } }),
  )
  await openHome(page)
  await page.locator('.game-card--tft').click()
  await page.getByRole('link', { name: 'Traits', exact: true }).click()
  await expect(page.locator('.traits-card')).toHaveCount(33)
  await page.getByRole('button', { name: /Suivant/ }).click()
  await expect(page.getByText('Trait 34', { exact: true })).toBeVisible()
  await page.getByLabel('Rechercher un trait').fill('Trait 65')
  await expect(page.getByText('Trait 65', { exact: true })).toBeVisible()
  await expect(page.locator('.traits-card')).toHaveCount(1)
})

test('laisse les 13 classes WoW sur une seule page', async ({ page }) => {
  const classes = Array.from({ length: 13 }, (_, index) => ({
    id: index + 1,
    name: `Classe ${String(index + 1).padStart(2, '0')}`,
    icon: null,
  }))
  await page.route('**/api/wow/classes', (route) =>
    route.fulfill({ json: { locale: 'fr_FR', edition: 'retail', data: classes } }),
  )
  await openHome(page)
  await page.locator('.game-card--wow').click()
  await expect(page.locator('.class-card')).toHaveCount(13)
  await expect(page.getByRole('link', { name: /Classe 13/ })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Pagination des résultats' })).toHaveCount(0)
})

test('laisse les runes LoL sur une seule page', async ({ page }) => {
  const runes = Array.from({ length: 62 }, (_, index) => ({
    id: index + 1,
    name: `Rune ${String(index + 1).padStart(2, '0')}`,
    icon: '',
    shortDescription: '',
    longDescription: '',
    keystone: false,
  }))
  await page.route('**/api/ddragon/runes', (route) =>
    route.fulfill({ json: { version, locale: 'fr_FR', data: [{ id: 1, name: 'Voie', runes }] } }),
  )
  await openHome(page)
  await page.locator('.game-card--league').click()
  await page.getByRole('link', { name: 'Runes →' }).click()
  await expect(page.locator('.collection-card')).toHaveCount(62)
  await expect(page.getByRole('link', { name: /Rune 62/ })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Pagination des résultats' })).toHaveCount(0)
})
