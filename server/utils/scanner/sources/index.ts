import type { SourceAdapter } from '../types'
import { createHotsSourceAdapter } from './hots'
import { createLolSourceAdapter } from './lol'
import { createTftSourceAdapter } from './tft'
import { createValorantSourceAdapter } from './valorant'
import { createWowSourceAdapter } from './wow'

export function createDefaultSourceAdapters(): SourceAdapter[] {
  return [
    createLolSourceAdapter(),
    createTftSourceAdapter(),
    createValorantSourceAdapter(),
    createWowSourceAdapter(),
    createHotsSourceAdapter(),
  ]
}
