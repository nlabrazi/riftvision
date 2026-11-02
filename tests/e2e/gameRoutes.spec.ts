import { expect, test } from '@playwright/test'

test('les racines de jeux présentent les deux expériences', async ({ page }) => {
  const routes = [
    ['/tft', 'Teamfight Tactics', '/tft/units'],
    ['/valorant', 'Valorant', '/valorant/agents'],
    ['/wow', 'World of Warcraft', '/wow/classes'],
    ['/hots', 'Heroes of the Storm', '/hots/heroes'],
  ]
  for (const [path, title, encyclopediaPath] of routes) {
    await page.goto(`${path}?source=ancien`)
    await expect(page).toHaveURL(new RegExp(`${path}\\?source=ancien$`))
    await expect(page.getByRole('heading', { name: `${title}.` })).toBeVisible()
    await expect(page.getByTestId('encyclopedia-action')).toHaveAttribute('href', encyclopediaPath)
    await expect(page.getByTestId('companion-coming-soon')).toBeDisabled()
  }
})

test('la racine League active le compagnon', async ({ page }) => {
  await page.goto('/league')
  await expect(page.getByRole('heading', { name: 'League of Legends.' })).toBeVisible()
  await expect(
    page.locator('[data-testid="companion-action"], [data-testid="companion-download-action"]'),
  ).toHaveCount(1)
  await expect(page.getByTestId('companion-coming-soon')).toHaveCount(0)
})
