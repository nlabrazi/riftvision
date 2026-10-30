import { expect, test } from '@playwright/test'

const version = '16.21.1'
const champions = {
  version,
  locale: 'fr_FR',
  data: {
    Ahri: {
      id: 'Ahri',
      key: '103',
      name: 'Ahri',
      title: 'Renarde à neuf queues',
      image: { full: 'Ahri.png' },
      tags: ['Mage'],
    },
  },
}
const items = {
  version,
  locale: 'fr_FR',
  data: [
    {
      id: '1001',
      name: 'Bottes',
      summary: 'Déplacement',
      description: 'Vitesse',
      icon: '1001.png',
      totalGold: 300,
      sellGold: 210,
      tags: ['Boots'],
      from: [],
      into: [],
    },
  ],
}
const runes = {
  version,
  locale: 'fr_FR',
  data: [
    {
      id: 8100,
      name: 'Domination',
      icon: 'perk-images/Styles/7200_Domination.png',
      runes: [
        {
          id: 8112,
          name: 'Électrocution',
          icon: 'perk-images/Styles/Domination/Electrocute/Electrocute.png',
          shortDescription: 'Dégâts',
          longDescription: 'Dégâts',
          keystone: true,
        },
      ],
    },
  ],
}

async function openHome(page: import('@playwright/test').Page) {
  const status = page.waitForResponse((response) => response.url().includes('/api/riot/status'))
  await page.goto('/')
  await status
}

test('recherche les contenus et ouvre leur fiche au clavier', async ({ page }) => {
  await page.route('**/api/ddragon/champions', (route) => route.fulfill({ json: champions }))
  await page.route('**/api/ddragon/items', (route) => route.fulfill({ json: items }))
  await page.route('**/api/ddragon/runes', (route) => route.fulfill({ json: runes }))
  await openHome(page)

  const open = page.getByRole('button', { name: 'Rechercher', exact: true })
  await open.click()
  const dialog = page.getByRole('dialog', { name: 'Rechercher' })
  const field = dialog.getByRole('searchbox', { name: 'Champion, objet ou rune' })
  await expect(field).toBeFocused()
  await field.fill('renarde')
  await expect(dialog.getByRole('link', { name: /Ahri/ })).toBeVisible()
  await field.fill('bottes')
  await expect(dialog.getByRole('link', { name: /Bottes/ })).toBeVisible()
  await field.fill('electrocution')
  await expect(dialog.getByRole('link', { name: /Électrocution/ })).toBeVisible()
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('button', { name: 'Fermer la recherche' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('link', { name: /Électrocution/ })).toBeFocused()
  await field.focus()
  await field.fill('introuvable')
  await expect(dialog.getByText('Aucun résultat. Essayez un autre terme.')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(open).toBeFocused()
  await open.click()
  await page.setViewportSize({ width: 390, height: 844 })
  await dialog.getByRole('searchbox').fill('bottes')
  await dialog.getByRole('link', { name: /Bottes/ }).focus()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  )
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/league\/items\/1001$/)
  await expect(page.getByRole('heading', { name: 'Bottes', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Rechercher', exact: true })).toBeVisible()
})

test('conserve les résultats disponibles et permet de réessayer une source en erreur', async ({
  page,
}) => {
  let itemsAvailable = false
  await page.route('**/api/ddragon/champions', (route) => route.fulfill({ json: champions }))
  await page.route('**/api/ddragon/items', (route) =>
    itemsAvailable
      ? route.fulfill({ json: items })
      : route.fulfill({ status: 503, json: { statusMessage: 'Indisponible' } }),
  )
  await page.route('**/api/ddragon/runes', (route) => route.fulfill({ json: runes }))
  await openHome(page)
  await page.getByRole('button', { name: 'Rechercher', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Rechercher' })
  const field = dialog.getByRole('searchbox')
  await field.fill('ahri')
  await expect(dialog.getByRole('alert')).toContainText('objets')
  await expect(dialog.getByRole('link', { name: /Ahri/ })).toBeVisible()
  itemsAvailable = true
  await dialog.getByRole('button', { name: 'Réessayer' }).click()
  await field.fill('bottes')
  await expect(dialog.getByRole('link', { name: /Bottes/ })).toBeVisible()
  await expect(dialog.getByRole('alert')).toHaveCount(0)
})
