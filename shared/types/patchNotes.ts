export interface PatchNoteLink {
  title: string
  publishedAt: string
  url: string
}

export interface PatchNotesResponse {
  sourceUrl: string
  articles: PatchNoteLink[]
}
