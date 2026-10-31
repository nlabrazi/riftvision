/** Champs communs des fichiers de résumé et de détail de Data Dragon. */
export interface DataDragonChampion {
  id: string
  key: string
  name: string
  title: string
  image: { full: string }
  tags: string[]
  [field: string]: unknown
}

export interface DataDragonChampions {
  version: string
  locale: 'fr_FR'
  data: Record<string, DataDragonChampion>
}

export interface DataDragonChampionDetails {
  version: string
  locale: 'fr_FR'
  data: DataDragonChampion
}

export interface DataDragonItem {
  id: string
  name: string
  description: string
  summary: string
  icon: string
  totalGold: number
  sellGold: number
  tags: string[]
  from: string[]
  into: string[]
}

export interface DataDragonItems {
  version: string
  locale: 'fr_FR'
  data: DataDragonItem[]
}

export interface DataDragonRune {
  id: number
  name: string
  icon: string
  shortDescription: string
  longDescription: string
  keystone: boolean
}

export interface DataDragonRunePath {
  id: number
  name: string
  icon: string
  runes: DataDragonRune[]
}

export interface DataDragonRunes {
  version: string
  locale: 'fr_FR'
  data: DataDragonRunePath[]
}
