import { expect, test } from '@playwright/test'

const catalog = { locale: 'fr_FR', edition: 'retail', data: [{ id: 8, name: 'Mage', icon: null }] }
const classDetail = {
  locale: 'fr_FR',
  edition: 'retail',
  data: {
    id: 8,
    name: 'Mage',
    icon: null,
    powerType: 'Mana',
    specializations: [{ id: 62, name: 'Arcanes' }],
  },
}
const specDetail = {
  locale: 'fr_FR',
  edition: 'retail',
  data: {
    id: 62,
    name: 'Arcanes',
    class: { id: 8, name: 'Mage' },
    role: 'Dégâts',
    powerType: 'Mana',
    primaryStat: 'Intelligence',
    descriptionMale: 'Manipule les arcanes.',
    descriptionFemale: 'Manipule les arcanes.',
    icon: null,
  },
}
async function openHome(page: import('@playwright/test').Page) {
  await page.route('**/api/riot/status?*', (route) =>
    route.fulfill({ json: { status: 'DISCONNECTED', isMock: false, globalMockEnabled: false } }),
  )
  const status = page.waitForResponse((response) => response.url().includes('/api/riot/status'))
  await page.goto('/')
  await status
}

test('ouvre la spécialisation depuis la classe et revient à sa fiche', async ({ page }) => {
  await page.route('**/api/wow/classes', (route) => route.fulfill({ json: catalog }))
  await page.route('**/api/wow/classes/8', (route) => route.fulfill({ json: classDetail }))
  await page.route('**/api/wow/specializations/62', (route) => route.fulfill({ json: specDetail }))
  await openHome(page)
  await page.locator('.game-card--wow').click()
  await page.getByRole('link', { name: 'Mage' }).click()
  await page.getByRole('link', { name: /Arcanes/ }).click()
  await expect(page.getByRole('heading', { name: 'Arcanes' })).toBeVisible()
  await expect(page.getByText('Dégâts', { exact: true }).last()).toBeVisible()
  await expect(page.getByText('Intelligence', { exact: true })).toBeVisible()
  await expect(page.getByText('Manipule les arcanes.')).toHaveCount(1)
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  )
  await page.getByRole('link', { name: '← Retour à Mage' }).click()
  await expect(page.getByRole('heading', { name: 'Mage' })).toBeVisible()
})

test('affiche les deux descriptions lorsqu’elles diffèrent et permet de réessayer', async ({
  page,
}) => {
  let available = false
  await page.route('**/api/wow/classes', (route) => route.fulfill({ json: catalog }))
  await page.route('**/api/wow/classes/8', (route) => route.fulfill({ json: classDetail }))
  await page.route('**/api/wow/specializations/62', (route) =>
    available
      ? route.fulfill({
          json: {
            ...specDetail,
            data: {
              ...specDetail.data,
              descriptionMale: 'Un protecteur.',
              descriptionFemale: 'Une protectrice.',
            },
          },
        })
      : route.fulfill({ status: 503, json: { statusMessage: 'Indisponible' } }),
  )
  await openHome(page)
  await page.locator('.game-card--wow').click()
  await page.getByRole('link', { name: 'Mage' }).click()
  await page.getByRole('link', { name: /Arcanes/ }).click()
  await expect(page.locator('.wow-notice[role="alert"]')).toContainText(
    'momentanément indisponible',
  )
  available = true
  await page.getByRole('button', { name: 'Réessayer' }).click()
  await expect(page.getByText('Un protecteur.')).toBeVisible()
  await expect(page.getByText('Une protectrice.')).toBeVisible()
})
