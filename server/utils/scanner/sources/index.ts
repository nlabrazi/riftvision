import type { SourceAdapter } from '../types'
import { createHotsSourceAdapter } from './hots'
import { createLolSourceAdapter } from './lol'
import { createTftSourceAdapter } from './tft'
import { createValorantSourceAdapter } from './valorant'
import { createWowSourceAdapter } from './wow'

export { createHotsSourceAdapter, type HotsSourceDependencies } from './hots'
export { createLolSourceAdapter, type LolSourceDependencies } from './lol'
export { createTftSourceAdapter, type TftSourceDependencies } from './tft'
export { createValorantSourceAdapter, type ValorantSourceDependencies } from './valorant'
export { createWowSourceAdapter, type WowSourceDependencies } from './wow'

export function createDefaultSourceAdapters(): SourceAdapter[] {
  return [
    createLolSourceAdapter(),
    createTftSourceAdapter(),
    createValorantSourceAdapter(),
    createWowSourceAdapter(),
    createHotsSourceAdapter(),
  ]
}
