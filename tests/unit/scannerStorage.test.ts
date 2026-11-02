import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { canonicalStringify, computeCanonicalHash } from '../../server/utils/scanner/hasher'
import {
  clearStoredSnapshots,
  createEmptySnapshots,
  getStoredSnapshots,
  saveSnapshots,
} from '../../server/utils/scanner/storage'
import type { ScanSnapshots } from '../../server/utils/scanner/types'

const TEST_STORAGE_DIR = path.join(process.cwd(), 'server', 'data')
const TEST_STORAGE_FILE = path.join(TEST_STORAGE_DIR, 'test-scan-snapshots.json')

describe('Scanner Hasher', () => {
  it('produces identical string representations regardless of key order', () => {
    const objA = { name: 'Jinx', role: 'Marksman', id: 222 }
    const objB = { role: 'Marksman', id: 222, name: 'Jinx' }

    expect(canonicalStringify(objA)).toBe(canonicalStringify(objB))
    expect(computeCanonicalHash(objA)).toBe(computeCanonicalHash(objB))
  })

  it('produces identical hashes for deeply nested structures with different key orders', () => {
    const data1 = {
      game: 'lol',
      meta: { patch: '14.21.1', items: [1, 2, 3], flags: { active: true, beta: false } },
    }
    const data2 = {
      meta: { flags: { beta: false, active: true }, items: [1, 2, 3], patch: '14.21.1' },
      game: 'lol',
    }

    expect(computeCanonicalHash(data1)).toBe(computeCanonicalHash(data2))
  })

  it('differentiates distinct objects and array order', () => {
    const arr1 = ['Aatrox', 'Ahri']
    const arr2 = ['Ahri', 'Aatrox']

    expect(computeCanonicalHash(arr1)).not.toBe(computeCanonicalHash(arr2))
  })

  it('respects requested hash truncation length', () => {
    const hashDefault = computeCanonicalHash('test')
    const hash8 = computeCanonicalHash('test', 8)
    const hash32 = computeCanonicalHash('test', 32)

    expect(hashDefault).toHaveLength(16)
    expect(hash8).toHaveLength(8)
    expect(hash32).toHaveLength(32)
    expect(hashDefault.startsWith(hash8)).toBe(true)
  })
})

describe('Scanner Storage', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_STORAGE_FILE)) {
      fs.unlinkSync(TEST_STORAGE_FILE)
    }
  })

  afterEach(() => {
    if (fs.existsSync(TEST_STORAGE_FILE)) {
      fs.unlinkSync(TEST_STORAGE_FILE)
    }
  })

  it('returns default empty snapshot structure when file does not exist', () => {
    const snapshots = getStoredSnapshots(TEST_STORAGE_FILE)
    expect(snapshots).toEqual(createEmptySnapshots())
    expect(snapshots.version).toBe(1)
    expect(snapshots.sources).toEqual({})
  })

  it('saves and reloads snapshot data accurately', () => {
    const mockSnapshots: ScanSnapshots = {
      version: 1,
      lastScan: '2026-11-02T21:00:00.000Z',
      sources: {
        lol_ddragon: {
          version: '14.21.1',
          fingerprint: 'abcdef1234567890',
          lastSuccessfulScan: '2026-11-02T21:00:00.000Z',
          metadata: { championsCount: 168 },
        },
      },
    }

    saveSnapshots(mockSnapshots, TEST_STORAGE_FILE)
    const loaded = getStoredSnapshots(TEST_STORAGE_FILE)

    expect(loaded).toEqual(mockSnapshots)
    expect(loaded.sources.lol_ddragon.version).toBe('14.21.1')
    expect(loaded.sources.lol_ddragon.metadata?.championsCount).toBe(168)
  })

  it('recovers gracefully with empty snapshot on corrupted JSON file', () => {
    fs.writeFileSync(TEST_STORAGE_FILE, '{ invalid-json', 'utf-8')
    const snapshots = getStoredSnapshots(TEST_STORAGE_FILE)
    expect(snapshots).toEqual(createEmptySnapshots())
  })

  it('recovers gracefully when version is missing or unexpected', () => {
    fs.writeFileSync(TEST_STORAGE_FILE, JSON.stringify({ version: 99, sources: {} }), 'utf-8')
    const snapshots = getStoredSnapshots(TEST_STORAGE_FILE)
    expect(snapshots).toEqual(createEmptySnapshots())
  })

  it('clears stored snapshots to an empty state', () => {
    const mockSnapshots: ScanSnapshots = {
      version: 1,
      lastScan: '2026-11-02T21:00:00.000Z',
      sources: {
        valorant: {
          fingerprint: '1234567890abcdef',
          lastSuccessfulScan: '2026-11-02T21:00:00.000Z',
        },
      },
    }

    saveSnapshots(mockSnapshots, TEST_STORAGE_FILE)
    expect(Object.keys(getStoredSnapshots(TEST_STORAGE_FILE).sources)).toHaveLength(1)

    clearStoredSnapshots(TEST_STORAGE_FILE)
    const cleared = getStoredSnapshots(TEST_STORAGE_FILE)
    expect(cleared.sources).toEqual({})
  })
})
