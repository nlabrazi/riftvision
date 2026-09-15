# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-01

### ✨ Features
- **Dual-View Ergonomics (Dashboard vs Focus Radar)**:
  - Add dedicated **Focus Radar & Alertes** view (`FocusRadarView.vue`) designed specifically for active in-game second-screen usage with zero cognitive overload.
  - Large-scale centered Summoner's Rift tactical map (460x460) with real-time champion positioning, alive/dead statuses, neutral objectives, and turret states.
  - Minimalist top HUD displaying only critical match vitals: game clock, team kill scoreboards, and dynamic gold difference lead badge.
  - Interactive Flash Alert demo test bar (`⚔️ Kill`, `🐉 Dragon`, `👑 Baron`, `🛍️ Power Spike`, `💀 Ace`) for real-time testing and tuning.
- **High-Impact Flash Alert Engine (`useFlashAlerts.ts` & `FlashAlertOverlay.vue`)**:
  - High-visibility visual notifications with distinct color themes (Purple for Baron/Ace, Gold/Red for Dragons, Crimson for Kills, Emerald for Legendary Power Spikes).
  - Queue-based management with auto-dismiss progress bar (3.5s to 5.0s depending on alert priority).
  - Actor vs Victim avatars with champion portraits, item icons, and gold values.
  - Non-blocking layout positioned at `top-24` with `pointer-events-none` wrapper to ensure zero UI interception.
  - Delta-filtered live ingestion (`latestLiveEvents`): historical events on match connection are filtered out, only triggering real-time alerts.
- **Native Web Audio API Sound Synthesizer**:
  - Contextual procedural audio cues for Baron, Dragon, Kills, Power Spikes, and Aces.
  - Zero external MP3/audio assets required, guaranteed zero network latency.
  - Global audio mute toggle (`🔊 Audio ON` / `🔇 Muet`) persisted in state with visual indicator in header.

### 🧪 Tests
- Add comprehensive Vitest unit tests for flash alert queueing, auto-dismiss, diff ingestion, item filtering, and mute states (`tests/unit/flashAlerts.test.ts`).
- Add Playwright E2E tests validating the Focus Radar view, large map rendering, alert trigger & dismiss flow, and audio toggle (`tests/e2e/flashAlerts.spec.ts`).

## [0.3.0] - 2026-03-01

### ✨ Features
- **Interactive Tactical Minimap (Summoner's Rift 2D)**:
  - Add interactive minimap component (`TacticalMinimap.vue`) on official Summoner's Rift 512x512 canvas (`sr-map.png`).
  - Real-time 10-champion pin projection with DDragon circular portraits, team borders, level badges, and death/respawn timers.
  - Interactive neutral objective markers for Dragon pit and Baron/Herald pit with live kill event statuses.
  - Interactive outer and inner turret landmarks with destroyed/alive state detection based on Riot game events.
  - Quick action toggle button on tactical dashboard (`data-testid="map-toggle-btn"`) and dedicated header view button (`data-testid="view-map-btn"`) accessible whenever connected in Demo or Live mode.
  - Standardized 2D map landmark and role coordinate system (`shared/utils/mapCoordinates.ts`).

### 🧪 Tests
- Add unit tests for 2D role coordinates, objective landmarks, and turret state extraction (`tests/unit/tacticalMap.test.ts`).
- Add Playwright E2E tests verifying minimap button appearance upon connection, interactive toggle, 10-champion pin rendering, and view switching (`tests/e2e/dashboard.spec.ts`).

## [0.2.1] - 2026-03-01

### ✨ Features
- **Explicit Live Mode & Clean Standby UX**:
  - Introduce dedicated Live listening toggle (`isLiveActive`) in header and empty state, preventing aggressive background polling loops when idle.
  - Replace aggressive red disconnected banner with an elegant Hextech amber/gold standby indicator (*« En attente du client League of Legends »*).
  - Relocate raw technical connection errors (`Riot API timeout after 1500ms`, socket errors) exclusively to the Diagnostic API view, keeping the tactical dashboard clean.

### 🧪 Tests
- Add unit tests for live mode lifecycle, clean standby state, and seamless mock/live transitions (`tests/unit/useRiotLive.test.ts`).
- Add Playwright E2E test verifying clean standby rendering without raw technical error banners, followed by explicit live mode activation (`tests/e2e/diagnostic.spec.ts`).

### 🛠️ Improvements & Bug Fixes
- Fix Biome lint warnings on non-null assertions in tests.

## [0.2.0] - 2026-03-01

### ✨ Features
- **Diff Engine & Economy Calculator**: Pure diff algorithm detecting inventory purchases/consumptions, kills, respawns, dragon/baron/turret takedowns, and Blue vs Red gold difference (`shared/utils/gameDiff.ts`)
- **Data Dragon CDN Helpers**: Static asset URLs for champion squares, item icons, and MM:SS time formatting (`shared/utils/ddragon.ts`)
- **Tactical Side-by-Side Dashboard**: Blue vs Red comparative scoreboard with KDA, level, respawn timers, gold difference $\Delta$, and full 6+1 item slots with DDragon icons (`app/components/TacticalDashboard.vue`)
- **Live Diff Event Feed**: Real-time chronological detection journal with category filters (Tous, Achats, Kills, Objectifs)
- **View Switcher**: Seamless toggling between Tactical Dashboard view and Diagnostic Console view (`app/pages/index.vue`)

### 🧪 Tests
- Add comprehensive Vitest unit tests for inventory diffing, turret/dragon/baron attribution, and economy calculation (`tests/unit/gameDiff.test.ts`)
- Add Playwright E2E tests for tactical dashboard rendering, champion display, and view switching (`tests/e2e/dashboard.spec.ts`)

### 🛠️ Improvements & Bug Fixes
- Fix async race condition in `useRiotLive` by adding sequence counters to discard stale out-of-order responses
- Fix Playwright hydration timing by awaiting status API response before interactions
- Use Nuxt 4 `#shared` alias for clean shared type and utility imports across client, server, and Nitro
- Configure deterministic single-worker sequential E2E test runs to prevent mock state collision

## [0.1.0] - 2026-03-01

### ✨ Features
- Add Riot Live Client Data API models and TypeScript types (`shared/types/riot.ts`)
- Add mock game dataset representing a real LoL match snapshot at 16:45 (`server/data/mockGame.ts`)
- Implement server-side Riot API client with HTTPS self-signed SSL bypass and timeout handling (`server/utils/riotClient.ts`)
- Add `/api/riot/status`, `/api/riot/live`, `/api/riot/events`, and `/api/riot/mock` endpoints
- Add second-screen diagnostic console page with mock mode toggle and Riot Games legal disclaimer (`app/pages/index.vue`)
- Add reactive `useRiotLive` composable with auto-polling and mock state management

### 🧪 Tests
- Add Vitest unit test suite verifying mock data integrity and Riot client behavior (`tests/unit/`)
- Add Playwright E2E test suite verifying diagnostic page, headers, disclaimers, and mock toggle (`tests/e2e/`)

### 🛠️ Tooling & Infra
- Configure Biome for ultra-fast linting, formatting, and CI checks (`biome.json`)
- Add standard scripts: `npm run lint`, `npm run format`, `npm run format:check`, `npm run test`, `npm run e2e`
- Maintain multi-stage Dockerfile and docker-compose configuration for local host-gateway bridging (`port 2999`)
- Add official Riot Games Developer Policy legal compliance disclaimer in app and docs
