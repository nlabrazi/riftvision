import { describe, expect, it, vi } from 'vitest'
import { createChampionMediaClient } from '../../server/utils/championMedia'

const url = (slot: string, extension: string) =>
  `champion-abilities/0103/ability_0103_${slot}1.${extension}`
const ability = (slot: string) => ({
  abilityVideoPath: url(slot, 'webm'),
  abilityVideoImagePath: url(slot, 'jpg'),
})

describe('aperçus des compétences LoL', () => {
  it('utilise les chemins associés aux touches et partage le cache par patch', async () => {
    const fetcher = vi.fn<typeof fetch>(
      async () =>
        new Response(
          JSON.stringify({
            id: 103,
            passive: ability('P'),
            spells: [
              { spellKey: 'w', ...ability('W') },
              { spellKey: 'q', ...ability('Q') },
            ],
          }),
        ),
    )
    const client = createChampionMediaClient(fetcher)
    const [first, second] = await Promise.all([
      client.getMedia('103', '16.21.1'),
      client.getMedia('103', '16.21.1'),
    ])
    expect(first).toEqual(second)
    expect(first.abilities.Q).toEqual({
      videoMp4: 'https://lol.dyn.riotcdn.net/x/videos/champion-abilities/0103/ability_0103_Q1.mp4',
      videoWebm:
        'https://lol.dyn.riotcdn.net/x/videos/champion-abilities/0103/ability_0103_Q1.webm',
      poster: 'https://lol.dyn.riotcdn.net/x/videos/champion-abilities/0103/ability_0103_Q1.jpg',
    })
    await client.getMedia('103', '16.21.2')
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(String(fetcher.mock.calls[0]?.[0])).toContain('/16.21/plugins/')
  })

  it('ignore les chemins externes et ceux d’un autre champion', async () => {
    const client = createChampionMediaClient(
      async () =>
        new Response(
          JSON.stringify({
            id: 103,
            passive: { abilityVideoPath: 'https://evil.example/video.webm' },
            spells: [
              { spellKey: 'q', abilityVideoPath: 'champion-abilities/0086/ability_0086_Q1.webm' },
            ],
          }),
        ),
    )
    expect((await client.getMedia('103', '16.21.1')).abilities).toEqual({})
  })

  it('rejette une version ou une réponse invalide et permet de réessayer', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('{}'))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 103, spells: [] })))
    const client = createChampionMediaClient(fetcher)
    await expect(client.getMedia('../103', '16.21.1')).rejects.toThrow()
    await expect(client.getMedia('103', '../bad')).rejects.toThrow()
    expect(fetcher).not.toHaveBeenCalled()
    await expect(client.getMedia('103', '16.21.1')).rejects.toThrow()
    await expect(client.getMedia('103', '16.21.1')).resolves.toEqual({ abilities: {} })
  })
})
