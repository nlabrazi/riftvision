# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
