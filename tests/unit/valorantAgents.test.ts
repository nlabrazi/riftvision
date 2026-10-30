import { describe, expect, it, vi } from 'vitest'
import {
  createValorantAgentsClient,
  ValorantAgentsUnavailableError,
} from '../../server/utils/valorantAgents'

const gekko = {
  uuid: 'e370fa57-4757-3604-3648-499e1f642d3f',
  displayName: 'Gekko',
  description: 'Un <b>agent</b>.',
  isPlayableCharacter: true,
  displayIcon: 'https://media.valorant-api.com/agents/gekko/icon.png',
  fullPortrait: 'https://media.valorant-api.com/agents/gekko/portrait.png',
  role: { displayName: 'Initiateur' },
  abilities: [
    {
      slot: 'Ability1',
      displayName: 'Altego',
      description: 'Lance <whitebold>Altego</>.',
      displayIcon: null,
    },
  ],
}
const source = { status: 200, data: [gekko, { isPlayableCharacter: false }] }

describe('catalogue des agents Valorant', () => {
  it('normalise les agents jouables, leurs rôles et compétences', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(source)))
    const client = createValorantAgentsClient(fetcher)
    expect(await client.getAgents()).toEqual({
      locale: 'fr-FR',
      data: [
        {
          id: gekko.uuid,
          name: 'Gekko',
          description: 'Un agent.',
          role: 'Initiateur',
          icon: gekko.displayIcon,
          portrait: gekko.fullPortrait,
          abilities: [
            { slot: 'Ability1', name: 'Altego', description: 'Lance Altego.', icon: null },
          ],
        },
      ],
    })
    expect(String(fetcher.mock.calls[0]?.[0])).toBe(
      'https://valorant-api.com/v1/agents?language=fr-FR&isPlayableCharacter=true',
    )
  })

  it('partage les requêtes et renouvelle le cache à expiration', async () => {
    let clock = 0
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(source)))
    const client = createValorantAgentsClient(fetcher, () => clock)
    await Promise.all([client.getAgents(), client.getAgents()])
    await client.getAgents()
    expect(fetcher).toHaveBeenCalledTimes(1)
    clock += 60 * 60 * 1000 + 1
    await client.getAgents()
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('refuse les images principales invalides, puis permet de réessayer', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: 200,
            data: [{ ...gekko, displayIcon: 'https://media.valorant-api.com.evil.test/icon.png' }],
          }),
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify(source)))
    const client = createValorantAgentsClient(fetcher)
    await expect(client.getAgents()).rejects.toBeInstanceOf(ValorantAgentsUnavailableError)
    expect((await client.getAgents()).data).toHaveLength(1)
  })

  it('tolère les informations facultatives indisponibles', async () => {
    const client = createValorantAgentsClient(
      async () =>
        new Response(
          JSON.stringify({
            status: 200,
            data: [
              {
                ...gekko,
                role: null,
                fullPortrait: 'https://example.com/image.png',
                abilities: [gekko.abilities[0], { displayName: 'Incomplet' }],
              },
            ],
          }),
        ),
    )
    const [agent] = (await client.getAgents()).data
    expect(agent?.role).toBeNull()
    expect(agent?.portrait).toBeNull()
    expect(agent?.abilities).toHaveLength(1)
  })
})
