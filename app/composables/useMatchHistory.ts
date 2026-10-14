import { getCurrentInstance, onMounted, ref } from 'vue'
import type { GameDiffEvent, TeamEconomySummary } from '../../shared/types/diff'
import type { SavedMatch } from '../../shared/types/history'
import type { RiotAllGameData } from '../../shared/types/riot'

const STORAGE_KEY = 'riftvision_match_history'

const matches = ref<SavedMatch[]>([])
const isLoading = ref(false)
const activeReportMatch = ref<SavedMatch | null>(null)
let hasLoaded = false

export function useMatchHistory() {
  async function loadHistory() {
    isLoading.value = true
    try {
      // 1. Essai de chargement depuis l'API serveur Nuxt
      const response = await fetch('/api/history')
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data?.matches)) {
          matches.value = data.matches
          // Met à jour la copie locale de secours
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.matches))
            } catch {
              // Ignore
            }
          }
          hasLoaded = true
          return
        }
      }
    } catch {
      // Fallback sur le localStorage si le serveur est inaccessible
    } finally {
      isLoading.value = false
    }

    // 2. Fallback localStorage
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            matches.value = parsed
          }
        }
      } catch {
        // Ignore
      }
    }
    hasLoaded = true
  }

  async function recordCompletedMatch(match: SavedMatch) {
    // Déduplication locale
    matches.value = [
      match,
      ...matches.value.filter(
        (m) => m.id !== match.id && Math.abs(m.timestamp - match.timestamp) > 5000,
      ),
    ].slice(0, 50)

    // Sauvegarde en localStorage (immédiat)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(matches.value))
      } catch {
        // Ignore
      }
    }

    // Sauvegarde asynchrone sur le serveur
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(match),
      })
    } catch (err) {
      console.warn('[RiftVision History] Échec sauvegarde distante, conservé en local :', err)
    }
  }

  async function deleteMatch(matchId: string) {
    matches.value = matches.value.filter((m) => m.id !== matchId)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(matches.value))
      } catch {
        // Ignore
      }
    }

    try {
      await fetch(`/api/history?id=${encodeURIComponent(matchId)}`, {
        method: 'DELETE',
      })
    } catch {
      // Ignore
    }
  }

  function openMatchReport(match: SavedMatch) {
    activeReportMatch.value = match
  }

  function closeMatchReport() {
    activeReportMatch.value = null
  }

  function buildMatchSnapshot(
    gameData: RiotAllGameData,
    blueEconomy: TeamEconomySummary,
    redEconomy: TeamEconomySummary,
    goldDifference: number,
    formattedGameTime: string,
    result: 'VICTORY' | 'DEFEAT',
    diffEvents: GameDiffEvent[] = [],
  ): SavedMatch {
    const activeSummoner = gameData?.activePlayer?.summonerName || ''
    const playerRecord =
      gameData?.allPlayers?.find((p) => p.summonerName === activeSummoner) ||
      gameData?.allPlayers?.[0]

    const kills = playerRecord?.scores?.kills || 0
    const deaths = playerRecord?.scores?.deaths || 0
    const assists = playerRecord?.scores?.assists || 0
    const cs = playerRecord?.scores?.creepScore || 0
    const duration = gameData?.gameData?.gameTime || 0
    const minutes = Math.max(1, duration / 60)
    const ratio = deaths === 0 ? 'Parfait' : ((kills + assists) / deaths).toFixed(1)
    const csPerMin = (cs / minutes).toFixed(1)

    const now = new Date()
    const dateFormatted = now.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })

    const matchId = `match-${Date.now()}-${playerRecord?.championName || 'unknown'}`

    return {
      id: matchId,
      timestamp: Date.now(),
      dateFormatted,
      durationSeconds: Math.round(duration),
      formattedGameTime: formattedGameTime || '00:00',
      result,
      championName: playerRecord?.championName || 'Inconnu',
      championIconUrl: playerRecord?.rawChampionName
        ? `https://ddragon.leagueoflegends.com/cdn/14.8.1/img/champion/${playerRecord.rawChampionName.replace('game_character_displayname_', '')}.png`
        : undefined,
      summonerName: playerRecord?.summonerName || activeSummoner || 'Invocateur',
      team: playerRecord?.team || 'ORDER',
      kda: {
        kills,
        deaths,
        assists,
        ratio,
      },
      cs,
      csPerMin,
      gameMode: gameData?.gameData?.gameMode || 'Failles de l’Invocateur',
      gameData,
      blueEconomy,
      redEconomy,
      goldDifference,
      diffEvents,
    }
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      if (!hasLoaded) {
        loadHistory()
      }
    })
  }

  return {
    matches,
    isLoading,
    activeReportMatch,
    loadHistory,
    recordCompletedMatch,
    deleteMatch,
    openMatchReport,
    closeMatchReport,
    buildMatchSnapshot,
  }
}
