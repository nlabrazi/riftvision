import type { WowTalentGroup, WowTalentNode, WowTalentOption } from '#shared/types/wow'

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function id(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value <= 10000000
}

/** Extrait uniquement les identifiants d'une URL Blizzard ; elle n'est jamais appelée directement. */
export function talentTreeId(index: unknown, specializationId: number): number | null {
  if (!record(index) || !Array.isArray(index.spec_talent_trees)) throw new Error('Index invalide')
  const ids = new Set<number>()
  for (const entry of index.spec_talent_trees) {
    if (!record(entry) || !record(entry.key) || typeof entry.key.href !== 'string') continue
    try {
      const url = new URL(entry.key.href)
      const match = /^\/data\/wow\/talent-tree\/(\d+)\/playable-specialization\/(\d+)$/.exec(
        url.pathname,
      )
      if (
        url.protocol !== 'https:' ||
        url.host !== 'eu.api.blizzard.com' ||
        url.username ||
        url.password ||
        !match
      )
        continue
      const tree = Number(match[1])
      if (id(tree) && Number(match[2]) === specializationId) ids.add(tree)
    } catch {
      // Une entrée invalide ne doit pas déclencher de requête vers une autre origine.
    }
  }
  if (ids.size > 1) throw new Error('Arbre ambigu')
  return [...ids][0] ?? null
}

function nodes(value: unknown): WowTalentNode[] {
  if (!Array.isArray(value) || value.length > 1000) throw new Error('Nœuds invalides')
  const result: WowTalentNode[] = []
  for (const node of value) {
    if (
      !record(node) ||
      !id(node.id) ||
      !id(node.display_row) ||
      !id(node.display_col) ||
      !Array.isArray(node.ranks)
    )
      continue
    const options = new Map<number, WowTalentOption>()
    for (const rank of node.ranks) {
      if (!record(rank) || !id(rank.rank)) continue
      const tooltips = Array.isArray(rank.choice_of_tooltips)
        ? rank.choice_of_tooltips
        : [rank.tooltip]
      for (const tooltip of tooltips) {
        if (
          !record(tooltip) ||
          !record(tooltip.talent) ||
          !id(tooltip.talent.id) ||
          typeof tooltip.talent.name !== 'string' ||
          !tooltip.talent.name.trim()
        )
          continue
        const spellTooltip = record(tooltip.spell_tooltip) ? tooltip.spell_tooltip : {}
        const spell = record(spellTooltip.spell) ? spellTooltip.spell : {}
        const option = options.get(tooltip.talent.id) ?? {
          id: tooltip.talent.id,
          name: tooltip.talent.name.trim(),
          spellId: id(spell.id) ? spell.id : null,
          ranks: [],
        }
        option.ranks.push({
          rank: rank.rank,
          description:
            typeof spellTooltip.description === 'string' && spellTooltip.description.trim()
              ? spellTooltip.description.trim()
              : null,
          defaultPoints:
            typeof rank.default_points === 'number' &&
            Number.isInteger(rank.default_points) &&
            rank.default_points > 0
              ? rank.default_points
              : 0,
        })
        options.set(option.id, option)
      }
    }
    result.push({
      id: node.id,
      row: node.display_row,
      column: node.display_col,
      options: [...options.values()],
    })
  }
  return result.sort((a, b) => a.row - b.row || a.column - b.column || a.id - b.id)
}

export function normalizeTalentTree(value: unknown, specializationId: number): WowTalentGroup[] {
  if (
    !record(value) ||
    !record(value.playable_specialization) ||
    value.playable_specialization.id !== specializationId ||
    (value.hero_talent_trees !== undefined && !Array.isArray(value.hero_talent_trees)) ||
    (Array.isArray(value.hero_talent_trees) && value.hero_talent_trees.length > 100)
  )
    throw new Error('Arbre invalide')
  const classNodes = nodes(value.class_talent_nodes)
  const specNodes = nodes(value.spec_talent_nodes)
  const specIds = new Set(specNodes.map((node) => node.id))
  const heroGroups: WowTalentGroup[] = []
  const heroIds = new Set<number>()
  for (const hero of value.hero_talent_trees ?? []) {
    if (!record(hero) || !id(hero.id) || typeof hero.name !== 'string' || !hero.name.trim())
      continue
    const heroNodes = nodes(hero.hero_talent_nodes)
    for (const node of heroNodes) heroIds.add(node.id)
    if (heroNodes.some((node) => specIds.has(node.id))) {
      heroGroups.push({ id: `hero-${hero.id}`, name: hero.name.trim(), nodes: heroNodes })
    }
  }
  return [
    { id: 'class', name: 'Classe', nodes: classNodes },
    {
      id: 'specialization',
      name: 'Spécialisation',
      nodes: specNodes.filter((node) => !heroIds.has(node.id)),
    },
    ...heroGroups,
  ]
}
