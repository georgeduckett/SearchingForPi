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
