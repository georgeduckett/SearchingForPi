// ─── Stats Panel Builder ──────────────────────────────────────────────────────
// Fluent API for building stats panels.

import { statCard, type StatCardOptions } from './card'
import { legend, explanation } from './legend'

/**
 * Builder for creating stats panels with a fluent API.
 *
 * @example
 * ```ts
 * const panel = buildStatsPanel()
 *   .addPiEstimate('estimate', { error: true, progress: true })
 *   .addCounter('total', 'Points plotted', { subtext: 'of 20,000 total' })
 *   .addLegend([
 *     { color: C_INSIDE, text: 'Inside circle' },
 *     { color: C_OUTSIDE, text: 'Outside circle' },
 *   ])
 *   .addExplanation('How it works', [...])
 *   .build()
 * ```
 */
export class StatsPanelBuilder {
  private parts: string[] = []

  /**
   * Add a π estimate stat card.
   */
  addPiEstimate(
    valueId: string,
    options: {
      label?: string
      valueClass?: string
      error?: boolean
      errorId?: string
      progress?: boolean
      progressId?: string
    } = {}
  ): this {
    const {
      label = 'π estimate',
      valueClass = 'stat-value large',
      error = false,
      errorId = 'error',
      progress = false,
      progressId = 'progress',
    } = options

    this.parts.push(
      statCard(label, valueId, {
        valueClass,
        errorId: error ? errorId : undefined,
        progressId: progress ? progressId : undefined,
      })
    )
    return this
  }

  /**
   * Add a counter stat card.
   */
  addCounter(
    valueId: string,
    label: string,
    options: {
      valueClass?: string
      subtext?: string
    } = {}
  ): this {
    this.parts.push(statCard(label, valueId, options))
    return this
  }

  /**
   * Add a custom stat card.
   */
  addStatCard(label: string, valueId: string, options: StatCardOptions = {}): this {
    this.parts.push(statCard(label, valueId, options))
    return this
  }

  /**
   * Add a legend section.
   */
  addLegend(items: Array<{ color: string; text: string }>): this {
    this.parts.push(legend(items))
    return this
  }

  /**
   * Add an explanation section.
   */
  addExplanation(title: string, paragraphs: string[], formula?: string): this {
    this.parts.push(explanation(title, paragraphs, formula))
    return this
  }

  /**
   * Add custom HTML.
   */
  addHtml(html: string): this {
    this.parts.push(html)
    return this
  }

  /**
   * Build the final HTML string.
   */
  build(): string {
    return this.parts.join('\n')
  }
}

/**
 * Creates a new stats panel builder.
 */
export function buildStatsPanel(): StatsPanelBuilder {
  return new StatsPanelBuilder()
}
