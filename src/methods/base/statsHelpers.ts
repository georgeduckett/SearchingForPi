// ─── Stats Helpers ────────────────────────────────────────────────────────────
// Reusable stats update patterns for method pages.
// Reduces boilerplate in controller files.

import { fmt } from '../../utils'

// ─── Pi Estimate Stats ────────────────────────────────────────────────────────

/**
 * Common stats elements for π estimation methods.
 */
export interface PiEstimateStatsElements {
  /** Element to display π estimate */
  estimate: HTMLElement
  /** Element to display error vs true π */
  error?: HTMLElement | null
  /** Element to display progress bar */
  progress?: HTMLElement | null
}

/**
 * Creates an updater for π estimate stats.
 * Handles the common pattern of showing estimate, error, and progress.
 */
export function createPiEstimateUpdater(
  elements: PiEstimateStatsElements,
  getEstimate: () => number,
  options: {
    /** Maximum value for progress bar (0-100%) */
    maxProgress?: number
    /** Function to get current progress value */
    getProgressValue?: () => number
    /** Threshold for "improving" error class */
    improvingThreshold?: number
  } = {}
): () => void {
  const { maxProgress = 100, getProgressValue, improvingThreshold = 0.01 } = options

  return function updatePiEstimate(): void {
    const pi = getEstimate()
    elements.estimate.textContent = fmt(pi)

    if (elements.error) {
      const error = Math.abs(pi - Math.PI)
      elements.error.textContent = `Error: ${fmt(error)}`
      elements.error.className =
        'stat-error ' + (error < improvingThreshold ? 'improving' : 'neutral')
    }

    if (elements.progress && getProgressValue) {
      const pct = Math.min((getProgressValue() / maxProgress) * 100, 100)
      elements.progress.style.width = `${pct}%`
    }
  }
}

// ─── Counter Stats ────────────────────────────────────────────────────────────

/**
 * Creates an updater for a simple counter stat.
 */
export function createCounterUpdater(
  element: HTMLElement,
  getValue: () => number,
  formatter: (n: number) => string = n => n.toLocaleString()
): () => void {
  return function updateCounter(): void {
    element.textContent = formatter(getValue())
  }
}

// ─── Composite Stats Updater ──────────────────────────────────────────────────

/**
 * Combines multiple update functions into a single updater.
 * Useful when you have several independent stats to update.
 */
export function combineUpdaters(...updaters: (() => void)[]): () => void {
  return function updateAll(): void {
    for (const updater of updaters) {
      updater()
    }
  }
}

// ─── Error Display Helpers ────────────────────────────────────────────────────

/**
 * Updates an error display element with appropriate styling.
 */
export function updateErrorDisplay(
  element: HTMLElement,
  error: number,
  options: {
    /** Threshold for "good" error (green/improving class) */
    goodThreshold?: number
    /** Threshold for "acceptable" error (neutral class) */
    acceptableThreshold?: number
    /** Number of decimal places */
    decimals?: number
  } = {}
): void {
  const { goodThreshold = 0.01, acceptableThreshold = 0.1, decimals = 6 } = options
  const absError = Math.abs(error)

  element.textContent = absError.toFixed(decimals)

  if (absError < goodThreshold) {
    element.className = 'stat-error improving'
  } else if (absError < acceptableThreshold) {
    element.className = 'stat-error neutral'
  } else {
    element.className = 'stat-error'
  }
}

// ─── Progress Bar Helpers ─────────────────────────────────────────────────────

/**
 * Updates a progress bar element.
 */
export function updateProgressBar(element: HTMLElement, current: number, max: number): void {
  const pct = Math.min((current / max) * 100, 100)
  element.style.width = `${pct}%`
}

// ─── Term Display Helpers ─────────────────────────────────────────────────────

/**
 * Formats a series term for display (e.g., "+1/3 = 0.333333").
 */
export function formatSeriesTerm(
  n: number,
  options: {
    /** Function to get the term value */
    getTerm: (n: number) => number
    /** Number of decimal places for value */
    decimals?: number
  }
): string {
  const { getTerm, decimals = 6 } = options
  const term = getTerm(n)
  const sign = term > 0 ? '+' : '-'
  const denominator = 2 * n + 1
  const value = Math.abs(term)
  return `${sign}1/${denominator} = ${sign}${value.toFixed(decimals)}`
}
