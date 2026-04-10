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
 * Options for creating a π estimate updater.
 */
export interface PiEstimateOptions {
  /** Maximum value for progress bar (0-100%) */
  maxProgress?: number
  /** Function to get current progress value */
  getProgressValue?: () => number
  /** Threshold for "improving" error class (default: 0.01) */
  improvingThreshold?: number
  /** Number of decimal places for estimate (default: 6) */
  decimals?: number
  /** Custom formatter for estimate (overrides decimals) */
  formatter?: (value: number) => string
  /** Show "Error: " prefix (default: true) */
  showErrorPrefix?: boolean
}

/**
 * Creates an updater for π estimate stats.
 * Handles the common pattern of showing estimate, error, and progress.
 */
export function createPiEstimateUpdater(
  elements: PiEstimateStatsElements,
  getEstimate: () => number,
  options: PiEstimateOptions = {}
): () => void {
  const {
    maxProgress = 100,
    getProgressValue,
    improvingThreshold = 0.01,
    decimals = 6,
    formatter,
    showErrorPrefix = true,
  } = options

  const formatValue = formatter ?? ((v: number) => v.toFixed(decimals))

  return function updatePiEstimate(): void {
    const pi = getEstimate()
    elements.estimate.textContent = formatValue(pi)

    if (elements.error) {
      const error = Math.abs(pi - Math.PI)
      const errorText = showErrorPrefix ? `Error: ${fmt(error)}` : fmt(error)
      elements.error.textContent = errorText
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

// ─── Stats Updater Builder ────────────────────────────────────────────────────

/**
 * Builder for creating stats updaters with a fluent API.
 * Reduces boilerplate when multiple stats need updating.
 *
 * @example
 * ```ts
 * const updateStats = createStatsUpdater()
 *   .piEstimate(elements.estimate, () => estimatePi(state.inside, state.total))
 *   .counter(elements.total, () => state.total)
 *   .error(elements.error, () => Math.abs(estimate - Math.PI), { threshold: 0.01 })
 *   .progress(elements.progress, () => state.total, MAX_DOTS)
 *   .build()
 * ```
 */
export class StatsUpdaterBuilder {
  private updaters: (() => void)[] = []

  /** Add a π estimate updater */
  piEstimate(element: HTMLElement, getEstimate: () => number, options?: PiEstimateOptions): this {
    const updater = createPiEstimateUpdater({ estimate: element }, getEstimate, options)
    this.updaters.push(updater)
    return this
  }

  /** Add a counter updater */
  counter(element: HTMLElement, getValue: () => number, formatter?: (n: number) => string): this {
    const updater = createCounterUpdater(element, getValue, formatter)
    this.updaters.push(updater)
    return this
  }

  /** Add an error display updater */
  error(
    element: HTMLElement,
    getError: () => number,
    options?: { threshold?: number; decimals?: number }
  ): this {
    const { threshold = 0.01, decimals = 6 } = options ?? {}
    const updater = () => {
      const error = getError()
      element.textContent = error.toFixed(decimals)
      element.className = 'stat-error ' + (error < threshold ? 'improving' : 'neutral')
    }
    this.updaters.push(updater)
    return this
  }

  /** Add a progress bar updater */
  progress(element: HTMLElement, getCurrent: () => number, max: number): this {
    const updater = () => {
      const pct = Math.min((getCurrent() / max) * 100, 100)
      element.style.width = `${pct}%`
    }
    this.updaters.push(updater)
    return this
  }

  /** Add a custom updater function */
  custom(updater: () => void): this {
    this.updaters.push(updater)
    return this
  }

  /** Build the combined updater function */
  build(): () => void {
    return combineUpdaters(...this.updaters)
  }
}

/**
 * Creates a new stats updater builder.
 */
export function createStatsUpdater(): StatsUpdaterBuilder {
  return new StatsUpdaterBuilder()
}
