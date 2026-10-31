import { describe, expect, it, vi } from 'vitest'
import { createWowClassesClient, WowUnavailableError } from '../../server/utils/wowClasses'

const credentials = { clientId: 'client', clientSecret: 'secret' }
const tooltip = (talentId: number, spellId: number, name: string) => ({
  talent: { id: talentId, name },
  spell_tooltip: { spell: { id: spellId }, description: `Effet ${name}` },
})
const classNode = {
  id: 100001,
  display_row: 1,
  display_col: 2,
  ranks: [{ rank: 1, tooltip: tooltip(200001, 300001, 'Bouclier'), default_points: 1 }],
}
const heroNode = {
  id: 100002,
  display_row: 2,
  display_col: 3,
  ranks: [
    {
      rank: 1,
      choice_of_tooltips: [tooltip(200002, 300002, 'Choix A'), tooltip(200003, 300003, 'Choix B')],
    },
  ],
}
const regularNode = {
  id: 100003,
  display_row: 3,
  display_col: 5,
  ranks: [
    { rank: 1, tooltip: tooltip(200004, 300004, 'Arcanes') },
    { rank: 2, tooltip: tooltip(200004, 300004, 'Arcanes') },
  ],
}
const tree = {
  playable_specialization: { id: 62 },
  class_talent_nodes: [classNode],
  spec_talent_nodes: [regularNode, heroNode],
  hero_talent_trees: [
    { id: 1, name: 'Voie valide', hero_talent_nodes: [heroNode] },
    { id: 2, name: 'Autre spécialisation', hero_talent_nodes: [{ ...heroNode, id: 100004 }] },
  ],
}
const index = {
  spec_talent_trees: [
    {
      key: {
        href: 'https://eu.api.blizzard.com/data/wow/talent-tree/658/playable-specialization/62?namespace=static-eu',
      },
    },
    { key: { href: 'https://evil.test/data/wow/talent-tree/999/playable-specialization/62' } },
  ],
}
function response(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status })
}
function fetcher() {
  return vi.fn<typeof fetch>(async (url) => {
    const path = String(url)
    if (path.includes('oauth.battle.net'))
      return response({ access_token: 'secret-token', expires_in: 3600 })
    if (path.includes('/talent-tree/index')) return response(index)
    if (path.includes('/talent-tree/658/playable-specialization/62')) return response(tree)
    if (path.includes('/media/spell/300001'))
      return response({
        assets: [{ key: 'icon', value: 'https://render.worldofwarcraft.com/eu/icons/56/a.jpg' }],
      })
    if (path.includes('/media/spell/300002'))
      return response({
        assets: [{ key: 'icon', value: 'https://render.worldofwarcraft.com.evil.test/a.jpg' }],
      })
    return response({}, 404)
  })
}

describe('talents WoW officiels', () => {
  it('sépare les groupes compatibles et conserve les rangs et les choix', async () => {
    const fetch = fetcher()
    const client = createWowClassesClient(credentials, fetch)
    const result = await client.getTalents(62)
    expect(result.data?.groups.map((group) => group.name)).toEqual([
      'Classe',
      'Spécialisation',
      'Voie valide',
    ])
    expect(result.data?.groups[0]?.nodes[0]?.options[0]).toEqual({
      id: 200001,
      name: 'Bouclier',
      spellId: 300001,
      ranks: [{ rank: 1, description: 'Effet Bouclier', defaultPoints: 1 }],
    })
    expect(result.data?.groups[1]?.nodes[0]?.options[0]?.ranks).toHaveLength(2)
    expect(result.data?.groups[2]?.nodes[0]?.options.map((item) => item.name)).toEqual([
      'Choix A',
      'Choix B',
    ])
    await client.getTalents(62)
    expect(
      fetch.mock.calls.filter(([url]) => String(url).includes('/talent-tree/658/')),
    ).toHaveLength(1)
    expect(JSON.stringify(result)).not.toContain('secret-token')
  })

  it('ne fait pas de requête sur une URL tierce et indique un arbre absent', async () => {
    const fetch = fetcher()
    const client = createWowClassesClient(credentials, fetch)
    expect((await client.getTalents(999)).data).toBeNull()
    expect(fetch.mock.calls.some(([url]) => String(url).includes('evil.test'))).toBe(false)
  })

  it('conserve les talents de classe et de spécialisation si Blizzard omet les héros', async () => {
    const base = fetcher()
    const fetch = vi.fn<typeof globalThis.fetch>(async (url, init) => {
      if (String(url).includes('/talent-tree/658/')) {
        const { hero_talent_trees: _heroes, ...withoutHeroes } = tree
        return response(withoutHeroes)
      }
      return base(url, init)
    })
    const client = createWowClassesClient(credentials, fetch)
    expect((await client.getTalents(62)).data?.groups.map((group) => group.name)).toEqual([
      'Classe',
      'Spécialisation',
    ])
  })

  it('ne met pas en cache un arbre invalide et permet de réessayer', async () => {
    let failed = false
    const base = fetcher()
    const fetch = vi.fn<typeof globalThis.fetch>(async (url, init) => {
      if (String(url).includes('/talent-tree/658/') && !failed) {
        failed = true
        return response({ ...tree, playable_specialization: { id: 63 } })
      }
      return base(url, init)
    })
    const client = createWowClassesClient(credentials, fetch)
    await expect(client.getTalents(62)).rejects.toBeInstanceOf(WowUnavailableError)
    expect((await client.getTalents(62)).data?.groups).toHaveLength(3)
  })

  it('réutilise les icônes officielles et refuse les autres origines', async () => {
    const fetch = fetcher()
    const client = createWowClassesClient(credentials, fetch)
    expect(await Promise.all([client.getSpellIcon(300001), client.getSpellIcon(300001)])).toEqual([
      'https://render.worldofwarcraft.com/eu/icons/56/a.jpg',
      'https://render.worldofwarcraft.com/eu/icons/56/a.jpg',
    ])
    expect(
      fetch.mock.calls.filter(([url]) => String(url).includes('/media/spell/300001')),
    ).toHaveLength(1)
    expect(await client.getSpellIcon(300002)).toBeNull()
  })
})
