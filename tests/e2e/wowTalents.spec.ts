import { expect, test } from '@playwright/test'

const spec = {
  locale: 'fr_FR',
  edition: 'retail',
  data: {
    id: 62,
    name: 'Arcanes',
    class: { id: 8, name: 'Mage' },
    role: 'Dégâts',
    powerType: 'Mana',
    primaryStat: 'Intelligence',
    descriptionMale: 'Un mage.',
    descriptionFemale: 'Un mage.',
    icon: null,
  },
}
const option = (id: number, name: string, description: string, defaultPoints = 0) => ({
  id,
  name,
  spellId: id,
  ranks: [{ rank: 1, description, defaultPoints }],
})
const talents = {
  locale: 'fr_FR',
  edition: 'retail',
  data: {
    groups: [
      {
        id: 'class',
        name: 'Classe',
        nodes: [
          {
            id: 1,
            row: 1,
            column: 1,
            options: [option(101, 'Barrière', 'Absorbe des dégâts.', 1)],
          },
        ],
      },
      {
        id: 'specialization',
        name: 'Spécialisation',
        nodes: [
          {
            id: 2,
            row: 1,
            column: 1,
            options: [
              option(102, 'Explosion', 'Des dégâts arcaniques.'),
              option(103, 'Orbe', 'Lance un orbe.'),
            ],
          },
        ],
      },
      {
        id: 'hero-1',
        name: 'Solfurie',
        nodes: [
          { id: 3, row: 1, column: 1, options: [option(104, 'Phénix', 'Invoque un phénix.')] },
        ],
      },
    ],
  },
}

async function openSpec(page: import('@playwright/test').Page) {
  await page.route('**/api/riot/status?*', (route) =>
    route.fulfill({ json: { status: 'DISCONNECTED', isMock: false, globalMockEnabled: false } }),
  )
  await page.route('**/api/wow/classes', (route) =>
    route.fulfill({
      json: { locale: 'fr_FR', edition: 'retail', data: [{ id: 8, name: 'Mage', icon: null }] },
    }),
  )
  await page.route('**/api/wow/classes/8', (route) =>
    route.fulfill({
      json: {
        locale: 'fr_FR',
        edition: 'retail',
        data: {
          id: 8,
          name: 'Mage',
          powerType: 'Mana',
          icon: null,
          specializations: [{ id: 62, name: 'Arcanes' }],
        },
      },
    }),
  )
  await page.route('**/api/wow/specializations/62', (route) => route.fulfill({ json: spec }))
  await page.route('**/api/wow/spells/*/icon', (route) => route.fulfill({ status: 404 }))
  const status = page.waitForResponse((response) => response.url().includes('/api/riot/status'))
  await page.goto('/')
  await status
  await page.locator('.game-card--wow').click()
  await page.getByTestId('encyclopedia-action').click()
  await page.getByRole('link', { name: 'Mage' }).click()
  await page.getByRole('link', { name: /Arcanes/ }).click()
}

test('consulte les talents de classe, de spécialisation et de héros', async ({ page }) => {
  await page.route('**/api/wow/specializations/62/talents', (route) =>
    route.fulfill({ json: talents }),
  )
  await openSpec(page)
  await expect(page.getByRole('heading', { name: 'Talents', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Barrière' }).click()
  await expect(page.getByText('Absorbe des dégâts.')).toBeVisible()
  await expect(page.getByText(/Accordé par défaut/)).toBeVisible()
  await page.getByRole('button', { name: 'Spécialisation', exact: true }).click()
  await page.getByRole('button', { name: /Explosion \/ Orbe/ }).click()
  await expect(page.getByText('Des dégâts arcaniques.')).toBeVisible()
  await expect(page.getByText('Lance un orbe.')).toBeVisible()
  await page.getByRole('button', { name: 'Héros · Solfurie' }).click()
  await page.getByRole('button', { name: 'Phénix' }).click()
  await expect(page.getByText('Invoque un phénix.')).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
})

test('les talents peuvent être réessayés sans bloquer la fiche', async ({ page }) => {
  let available = false
  await page.route('**/api/wow/specializations/62/talents', (route) =>
    available
      ? route.fulfill({ json: talents })
      : route.fulfill({ status: 503, json: { statusMessage: 'Indisponible' } }),
  )
  await openSpec(page)
  await expect(page.getByRole('heading', { name: 'Arcanes', exact: true })).toBeVisible()
  await expect(page.locator('.talents').getByRole('alert')).toContainText(
    'Les talents sont momentanément indisponibles',
  )
  available = true
  await page.getByRole('button', { name: 'Réessayer' }).click()
  await expect(page.getByRole('button', { name: 'Barrière' })).toBeVisible()
})
