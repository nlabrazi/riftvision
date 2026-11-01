import { describe, expect, it, vi } from 'vitest'
import {
  createValorantAbilityMediaClient,
  matchAbilityMedia,
} from '../../server/utils/valorantAbilityMedia'
import type { ValorantAgent, ValorantAgentsResponse } from '#shared/types/valorant'

const id = 'e370fa57-4757-3604-3648-499e1f642d3f'
const agent: ValorantAgent = {
  id,
  name: 'Gekko',
  description: '',
  role: null,
  icon: '',
  portrait: null,
  abilities: [
    { slot: 'Ability1', name: 'Altego', description: '', icon: null },
    { slot: 'Ultimate', name: 'Mordicus', description: '', icon: null },
    { slot: 'Passive', name: 'Globule', description: '', icon: null },
  ],
}
const video =
  'https://cmsassets.rgpub.io/sanity/files/dsfx7636/game_data/abc123.mp4?accountingTag=VAL'
const poster =
  'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data/abc123-128x128.png?accountingTag=VAL'
const group = (title: string, src = video) => ({
  thumbnail: { url: poster },
  content: { title, media: { sources: [{ src, type: 'video/mp4' }] } },
})
const page = { blades: [{ type: 'iconTab', groups: [group('A - ALTEGO'), group('MORDICUS')] }] }
const index = {
  blades: [{ items: [{ title: 'Gekko', action: { payload: { url: '/fr-fr/agents/gekko' } } }] }],
}
const html = (value: unknown) =>
  `<html><script id="__NEXT_DATA__" type="application/json">${JSON.stringify({ props: { pageProps: { page: value } } })}</script></html>`
const catalog: ValorantAgentsResponse = { locale: 'fr-FR', data: [agent] }

describe('vidéos des compétences Valorant', () => {
  it('associe les vidéos par nom et laisse les passifs sans correspondance', () => {
    expect(matchAbilityMedia(page, agent)).toEqual({
      abilities: {
        Ability1: { videoMp4: video, videoWebm: null, poster },
        Ultimate: { videoMp4: video, videoWebm: null, poster },
      },
    })
  })

  it('gère les titres combinés, les variantes connues et les noms anglais', () => {
    const astra = {
      ...agent,
      id: '41fb69c1-4189-7b37-f117-bcaf1e96f1bf',
      abilities: [
        { slot: 'Ultimate', name: 'Division cosmique', icon: null, description: '' },
        { slot: 'Passive', name: 'Forme astrale', icon: null, description: '' },
      ],
    }
    expect(
      Object.keys(
        matchAbilityMedia(
          { blades: [{ type: 'iconTab', groups: [group('FORME ASTRALE / DIVISION COSMIQUE')] }] },
          astra,
        ).abilities,
      ),
    ).toEqual(['Ultimate', 'Passive'])
    const neon = {
      ...agent,
      id: 'bb2a4828-46eb-8cd1-e765-15848195d751',
      abilities: [{ slot: 'Ultimate', name: 'Ultra-vitesse', icon: null, description: '' }],
    }
    expect(
      matchAbilityMedia({ blades: [{ type: 'iconTab', groups: [group('SURRÉGIME')] }] }, neon)
        .abilities.Ultimate,
    ).toBeTruthy()
    expect(
      matchAbilityMedia({ blades: [{ type: 'iconTab', groups: [group('HARMONIZE')] }] }, agent, {
        Ability1: 'Harmonize',
      }).abilities.Ability1,
    ).toBeTruthy()
    expect(
      matchAbilityMedia({ blades: [{ type: 'iconTab', groups: [group('M-pulse')] }] }, agent, {
        Ability1: 'M-pulse',
      }).abilities.Ability1,
    ).toBeTruthy()
  })

  it('écarte une URL extérieure et une correspondance ambiguë', () => {
    const evil = group(
      'ALTEGO',
      'https://cmsassets.rgpub.io.evil.test/sanity/files/dsfx7636/game_data/a.mp4',
    )
    const duplicate = {
      blades: [{ type: 'iconTab', groups: [evil, group('MORDICUS'), group('MORDICUS')] }],
    }
    expect(matchAbilityMedia(duplicate, agent)).toEqual({ abilities: {} })
  })

  it('charge les pages Riot de manière bornée et partage les requêtes', async () => {
    const fetcher = vi.fn<typeof fetch>(
      async (url) => new Response(html(String(url).endsWith('/agents/') ? index : page)),
    )
    const client = createValorantAbilityMediaClient(fetcher, async () => catalog)
    const [a, b] = await Promise.all([client.getMedia(id), client.getMedia(id)])
    expect(a).toEqual(b)
    expect(Object.keys(a.abilities)).toEqual(['Ability1', 'Ultimate'])
    expect(fetcher).toHaveBeenCalledTimes(2)
    await client.getMedia(id)
    expect(fetcher).toHaveBeenCalledTimes(2)
    await expect(client.getMedia('../bad')).rejects.toThrow()
  })

  it('ne conserve pas les erreurs et ne suit pas de liens hors du site Riot', async () => {
    let fail = true
    const fetcher = vi.fn<typeof fetch>(async () =>
      fail
        ? new Response('indisponible', { status: 503 })
        : new Response(
            html({
              blades: [
                {
                  items: [
                    {
                      title: 'Gekko',
                      action: { payload: { url: 'https://evil.test/agents/gekko' } },
                    },
                    ...index.blades[0].items,
                  ],
                },
              ],
            }),
          ),
    )
    const client = createValorantAbilityMediaClient(fetcher, async () => catalog)
    await expect(client.getMedia(id)).rejects.toThrow()
    fail = false
    await client.getMedia(id)
    expect(
      fetcher.mock.calls.every(([url]) => String(url).startsWith('https://playvalorant.com/')),
    ).toBe(true)
  })
})
