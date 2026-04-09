// ─── Basel Problem State ──────────────────────────────────────────────────────
// State type definition and factory for the Basel problem method.

// ─── Types ────────────────────────────────────────────────────────────────────

export interface State {
  terms: number
  sum: number
  running: boolean
  intervalId: ReturnType<typeof setInterval> | null
  /** Controller instance for cleanup (set during init) */
  _controller?: { cleanup(): void }
}

// ─── Initial State Factory ───────────────────────────────────────────────────

export function createInitialState(): State {
  return {
    terms: 0,
    sum: 0,
    running: false,
    intervalId: null,
  }
}
