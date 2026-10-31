const source = 'https://raw.githubusercontent.com/HeroesToolChest/heroes-images/main/heroesimages'

/** Images de jeu diffusées par la communauté HeroesToolChest. */
export function hotsImage(folder: 'heroportraits' | 'abilitytalents', name: string | null): string {
  if (!name || !/^[A-Za-z0-9_.-]+\.png$/.test(name)) return ''
  return `${source}/${folder}/${encodeURIComponent(name)}`
}
