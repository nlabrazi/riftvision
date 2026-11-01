import { expect, test } from '@playwright/test'

test('les anciennes adresses redirigent vers les catalogues et conservent les paramètres', async ({
  request,
}) => {
  const routes = [
    ['/tft', '/tft/units'],
    ['/valorant', '/valorant/agents'],
    ['/wow', '/wow/classes'],
    ['/hots', '/hots/heroes'],
    ['/tft/champions/DA_Ahri', '/tft/units/DA_Ahri'],
  ]
  for (const [oldPath, newPath] of routes) {
    const response = await request.get(`${oldPath}?source=ancien`, { maxRedirects: 0 })
    expect(response.status(), oldPath).toBe(302)
    expect(response.headers().location, oldPath).toBe(`${newPath}?source=ancien`)
  }
})

test('une ancienne adresse conserve son ancre dans le navigateur', async ({ page }) => {
  await page.goto('/valorant?source=ancien#agents')
  await expect(page).toHaveURL(/\/valorant\/agents\?source=ancien#agents$/)
  await expect(page.getByRole('heading', { name: 'Les agents Valorant.' })).toBeVisible()
})
