// ─── Stats Panel Helpers ────────────────────────────────────────────────────
// Utilities for building stat cards, legends, and explanation sections.

/**
 * Creates HTML for a stats row with label and value.
 */
export function statsRow(label: string, id: string, valueClass = 'stat-value'): string {
  return `<div class="stat-row"><span class="stat-label">${label}</span><span class="${valueClass}" id="${id}">—</span></div>`
}

/**
 * Creates HTML for a progress bar.
 */
export function statsProgressBar(id: string): string {
  return `<div class="progress-bar"><div class="progress-fill" id="${id}" style="width: 0%"></div></div>`
}

/**
 * Updates a stat element's text content.
 */
export function updateStat(id: string, value: string | number, parent: HTMLElement): void {
  const el = parent.querySelector(`#${id}`)
  if (el) el.textContent = String(value)
}

/**
 * Updates a progress bar's width.
 */
export function updateProgress(id: string, percent: number, parent: HTMLElement): void {
  const el = parent.querySelector(`#${id}`) as HTMLElement
  if (el) el.style.width = `${Math.min(100, Math.max(0, percent))}%`
}

// ─── Stat Card Builder ──────────────────────────────────────────────────────

/**
 * Creates HTML for a stat card with label, value, and optional subtext.
 */
export function statCard(
  label: string,
  valueId: string,
  options: {
    valueClass?: string
    subtext?: string
    errorId?: string
    progressId?: string
  } = {}
): string {
  const { valueClass = 'stat-value', subtext, errorId, progressId } = options

  let html = `
<div class="stat-card">
  <div class="stat-label">${label}</div>
  <div class="${valueClass}" id="${valueId}">—</div>
  `

  if (errorId) {
    html += `<div class="stat-error neutral" id="${errorId}">Error: —</div>`
  }

  if (progressId) {
    html += `
  <div class="progress-bar-wrap">
    <div class="progress-bar-fill" id="${progressId}" style="width:0%"></div>
  </div>
  `
  }

  if (subtext) {
    html += `<div class="stat-sub">${subtext}</div>`
  }

  html += `</div>`
  return html
}

/**
 * Creates HTML for a legend item.
 */
export function legendItem(color: string, text: string): string {
  return `<div class="legend-item"><div class="legend-dot" style="background:${color}"></div>${text}</div>`
}

/**
 * Creates HTML for a legend section from an array of items.
 */
export function legend(items: Array<{ color: string; text: string }>): string {
  return `<div class="legend">${items.map(i => legendItem(i.color, i.text)).join('')}</div>`
}

/**
 * Creates HTML for an explanation section.
 */
export function explanation(title: string, paragraphs: string[], formula?: string): string {
  let html = `<div class="explanation"><h3>${title}</h3>`
  for (const p of paragraphs) {
    html += `<p>${p}</p>`
  }
  if (formula) {
    html += `<div class="formula">${formula}</div>`
  }
  html += `</div>`
  return html
}

// ─── Stats Panel Builder ─────────────────────────────────────────────────────

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
  addPiEstimate(valueId: string, options: {
    label?: string
    valueClass?: string
    error?: boolean
    errorId?: string
    progress?: boolean
    progressId?: string
  } = {}): this {
    const {
      label = 'π estimate',
      valueClass = 'stat-value large',
      error = false,
      errorId = 'error',
      progress = false,
      progressId = 'progress'
    } = options
    
    this.parts.push(statCard(label, valueId, {
      valueClass,
      errorId: error ? errorId : undefined,
      progressId: progress ? progressId : undefined,
    }))
    return this
  }

  /**
   * Add a counter stat card.
   */
  addCounter(valueId: string, label: string, options: {
    valueClass?: string
    subtext?: string
  } = {}): this {
    this.parts.push(statCard(label, valueId, options))
    return this
  }

  /**
   * Add a custom stat card.
   */
  addStatCard(label: string, valueId: string, options: {
    valueClass?: string
    subtext?: string
    errorId?: string
    progressId?: string
  } = {}): this {
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
