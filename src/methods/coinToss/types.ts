// ─── Coin Toss Types ──────────────────────────────────────────────────────────
// Type definitions and constants for the coin toss method.

// ─── Constants ───────────────────────────────────────────────────────────────
export const CANVAS_W = 560
export const CANVAS_H = 320
export const MAX_SEQUENCES = 10_000
export const MAX_GRID_COLS = 20
export const MAX_GRID_ROWS = 10

// ─── Types ───────────────────────────────────────────────────────────────────
export interface Sequence {
  tosses: boolean[]
  heads: number
  total: number
  ratio: number
}

export interface State {
  sequences: Sequence[]
  sumRatios: number
  sequenceBatch: Sequence[]
  currentSequence: Sequence | null
  autoAdding: boolean
  autoRafId: ReturnType<typeof setTimeout> | null
  newCoinIndex: number | null
  highlightTimeout: ReturnType<typeof setTimeout> | null
  highlightComplete: boolean
}

// ─── State Factory ───────────────────────────────────────────────────────────
export function createInitialState(): State {
  return {
    sequences: [],
    sumRatios: 0,
    sequenceBatch: [],
    currentSequence: null,
    autoAdding: false,
    autoRafId: null,
    newCoinIndex: null,
    highlightTimeout: null,
    highlightComplete: false,
  }
}

// ─── Sequence Helpers ────────────────────────────────────────────────────────
export function createEmptySequence(): Sequence {
  return { tosses: [], heads: 0, total: 0, ratio: 0 }
}

export function advanceSequence(seq: Sequence, maxTosses = MAX_GRID_COLS): boolean {
  const isWin = seq.heads > seq.total - seq.heads && seq.total > 0
  if (isWin) {
    seq.ratio = seq.heads / seq.total
    return true
  }

  if (seq.total >= maxTosses) {
    while (!(seq.heads > seq.total - seq.heads)) {
      const isHead = Math.random() < 0.5
      seq.tosses.push(isHead)
      seq.total++
      if (isHead) seq.heads++
    }
    seq.ratio = seq.heads / seq.total
    return true
  }

  const isHead = Math.random() < 0.5
  seq.tosses.push(isHead)
  seq.total++
  if (isHead) seq.heads++

  const tails = seq.total - seq.heads

  if (seq.heads > tails) {
    seq.ratio = seq.heads / seq.total
    return true
  }

  if (seq.total >= maxTosses) {
    while (!(seq.heads > seq.total - seq.heads)) {
      const queuedHead = Math.random() < 0.5
      seq.tosses.push(queuedHead)
      seq.total++
      if (queuedHead) seq.heads++
    }
    seq.ratio = seq.heads / seq.total
    return true
  }

  seq.ratio = seq.heads / seq.total
  return false
}

export function estimatePi(sumRatios: number, numSequences: number): number {
  if (numSequences === 0) return 0
  const avgRatio = sumRatios / numSequences
  return 4 * avgRatio
}
