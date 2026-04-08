// ─── HTML Template Builders ──────────────────────────────────────────────────
// Reusable HTML template fragments for page layouts.

// ─── Page Header ──────────────────────────────────────────────────────────────

/**
 * Builds the page header HTML with optional index, title, and subtitle.
 */
export function buildPageHeader(options: {
  title: string
  subtitle?: string
  index?: string
  indexPrefix?: string
}): string {
  const { title, subtitle, index, indexPrefix = '' } = options
  const indexHtml = index ? `<span class="page-index">${indexPrefix}${index}</span>` : ''
  const subtitleHtml = subtitle ? `<p class="page-subtitle">${subtitle}</p>` : ''

  return `
    <header class="page-header">
      ${indexHtml}
      <h2 class="page-title">${title}</h2>
      ${subtitleHtml}
    </header>
  `
}

// ─── Canvas Wrapper ───────────────────────────────────────────────────────────

/**
 * Builds a canvas element HTML with specified dimensions.
 */
export function buildCanvas(options: {
  width: number
  height: number
  wrapperClass?: string
}): string {
  const { width, height, wrapperClass = 'visualization' } = options
  return `
    <div class="${wrapperClass}">
      <canvas id="canvas" width="${width}" height="${height}"></canvas>
    </div>
  `
}

/**
 * Builds a canvas with wrapper div (for viz-layout).
 */
export function buildCanvasWithWrapper(options: { width: number; height: number }): string {
  const { width, height } = options
  return `
    <div class="canvas-wrapper">
      <canvas id="canvas" width="${width}" height="${height}"></canvas>
    </div>
  `
}

// ─── Control Buttons ──────────────────────────────────────────────────────────

export interface ControlButtonsOptions {
  hasStartPause?: boolean
  hasStep?: boolean
  hasReset?: boolean
  extraControls?: string
  startLabel?: string
  stepLabel?: string
  resetLabel?: string
  resetDisabled?: boolean
  primaryButton?: 'start' | 'step'
}

/**
 * Builds control buttons HTML with configurable options.
 */
export function buildControlButtons(options: ControlButtonsOptions = {}): string {
  const {
    hasStartPause = true,
    hasStep = true,
    hasReset = true,
    extraControls = '',
    startLabel = 'Start',
    stepLabel = 'Step',
    resetLabel = 'Reset',
    resetDisabled = false,
    primaryButton = 'start',
  } = options

  const buttons: string[] = []

  if (hasStartPause) {
    const primaryClass = primaryButton === 'start' ? ' primary' : ''
    buttons.push(`<button class="btn${primaryClass}" id="btn-start">${startLabel}</button>`)
  }

  if (hasStep) {
    const primaryClass = primaryButton === 'step' ? ' primary' : ''
    buttons.push(`<button class="btn${primaryClass}" id="btn-step">${stepLabel}</button>`)
  }

  if (extraControls) {
    buttons.push(extraControls)
  }

  if (hasReset) {
    const disabledAttr = resetDisabled ? ' disabled' : ''
    buttons.push(`<button class="btn" id="btn-reset"${disabledAttr}>${resetLabel}</button>`)
  }

  return buttons.filter(Boolean).join('\n')
}

/**
 * Builds the controls container HTML.
 */
export function buildControlsContainer(buttonsHtml: string, extraStyles = ''): string {
  return `
    <div class="controls" style="${extraStyles}">
      ${buttonsHtml}
    </div>
  `
}

// ─── Stats Panel ──────────────────────────────────────────────────────────────

/**
 * Builds a stats panel container HTML.
 */
export function buildStatsPanel(content: string): string {
  return `
    <div class="stats-panel">
      ${content}
    </div>
  `
}

// ─── Full Page Layouts ────────────────────────────────────────────────────────

/**
 * Builds the simple page layout (canvas above, controls and stats below).
 */
export function buildSimplePageLayout(options: {
  header: string
  canvas: string
  controls: string
  stats: string
}): string {
  const { header, canvas, controls, stats } = options
  return `
    ${header}
    ${canvas}
    ${controls}
    ${stats}
  `
}

/**
 * Builds the viz-layout (two-column: canvas left, stats right).
 */
export function buildVizLayout(options: {
  header: string
  canvas: string
  controls: string
  stats: string
}): string {
  const { header, canvas, controls, stats } = options
  return `
    ${header}
    <div class="viz-layout">
      <div>
        ${canvas}
        ${controls}
      </div>
      ${stats}
    </div>
  `
}
