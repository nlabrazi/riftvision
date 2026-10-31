import type { HotsMap, HotsMapResponse, HotsMapsResponse } from '#shared/types/hots'
import snapshot from '../data/hots-maps.json'

const maps = snapshot.data as HotsMap[]

export function getHotsMaps(): HotsMapsResponse {
  return {
    version: snapshot.version,
    locale: 'fr_FR',
    data: maps.map(({ objectives: _objectives, ...map }) => map),
  }
}

export function getHotsMap(id: string): HotsMapResponse | null {
  const map = maps.find((entry) => entry.id === id)
  return map ? { version: snapshot.version, locale: 'fr_FR', data: map } : null
}
