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
