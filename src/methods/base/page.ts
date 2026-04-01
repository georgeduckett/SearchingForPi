import type { Page } from '../../router'
import { queryRequired } from '../../utils'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PageOptions {
  /** Title displayed in the header */
  title: string
  /** Subtitle/description */
  subtitle?: string
  /** Index label (e.g., "01", "Method") */
  index?: string
  /** Canvas width (default: 560) */
  canvasWidth?: number
  /** Canvas height (default: 560) */
  canvasHeight?: number
  /** Whether to show start/pause button (default: true) */
  hasStartPause?: boolean
  /** Whether to show step button (default: true) */
  hasStep?: boolean
  /** Whether to show reset button (default: true) */
  hasReset?: boolean
  /** Additional control buttons */
  extraControls?: string
  /** Additional stats elements */
  extraStats?: string
}

export interface PageContext<S> {
  /** The canvas element */
  canvas: HTMLCanvasElement
  /** The 2D rendering context */
  ctx: CanvasRenderingContext2D
  /** Start/pause button (if hasStartPause is true) */
  btnStart: HTMLButtonElement | null
  /** Step button (if hasStep is true) */
  btnStep: HTMLButtonElement | null
  /** Reset button (if hasReset is true) */
  btnReset: HTMLButtonElement | null
  /** The page state */
  state: S
  /** Stats container element */
  statsContainer: HTMLElement
}

export interface PageMethods<S> {
  /** Called once to initialize the page after DOM is ready */
  init?(ctx: PageContext<S>): void
  /** Draw the current state to the canvas */
  draw(ctx: PageContext<S>): void
  /** Start/resume the animation */
  start?(ctx: PageContext<S>): void
  /** Pause the animation */
  pause?(ctx: PageContext<S>): void
  /** Perform a single step */
  step?(ctx: PageContext<S>): void
  /** Reset to initial state */
  reset(ctx: PageContext<S>): void
  /** Cleanup when page is destroyed */
  cleanup?(ctx: PageContext<S>): void
}

// ─── Page Factory Builder ────────────────────────────────────────────────────

/**
 * Creates a page factory with reduced boilerplate.
 * Handles common patterns: canvas setup, controls, stats panel, animation loop.
 */
export function createPageFactory<S>(
  options: PageOptions,
  initialState: S,
  methods: PageMethods<S>
): () => Page {
  const {
    title,
    subtitle,
    index,
    canvasWidth = 560,
    canvasHeight = 560,
    hasStartPause = true,
    hasStep = true,
    hasReset = true,
    extraControls = '',
    extraStats = '',
  } = options

  return function pageFactory(): Page {
    const state: S = JSON.parse(JSON.stringify(initialState))
    let animationId: number | null = null
    let running = false

    // Build control buttons HTML
    const controlsHtml = [
      hasStartPause ? `<button class="btn" id="btn-start">Start</button>` : '',
      hasStep ? `<button class="btn" id="btn-step">Step</button>` : '',
      extraControls,
      hasReset ? `<button class="btn" id="btn-reset">Reset</button>` : '',
    ].filter(Boolean).join('\n')

    function render(): HTMLElement {
      const page = document.createElement('div')
      page.className = 'page'

      page.innerHTML = `
        <header class="page-header">
          ${index ? `<span class="page-index">${index}</span>` : ''}
          <h2 class="page-title">${title}</h2>
          ${subtitle ? `<p class="page-subtitle">${subtitle}</p>` : ''}
        </header>

        <div class="visualization">
          <canvas id="canvas" width="${canvasWidth}" height="${canvasHeight}"></canvas>
        </div>

        <div class="controls">
          ${controlsHtml}
        </div>

        <div class="stats-panel">
          ${extraStats}
        </div>
      `

      return page
    }

    function cleanup(): void {
      if (animationId !== null) {
        cancelAnimationFrame(animationId)
        animationId = null
      }
      running = false

      const ctx: PageContext<S> = {
        canvas: null as unknown as HTMLCanvasElement,
        ctx: null as unknown as CanvasRenderingContext2D,
        btnStart: null,
        btnStep: null,
        btnReset: null,
        state,
        statsContainer: null as unknown as HTMLElement,
      }

      methods.cleanup?.(ctx)
    }

    // The actual page object
    const page: Page = { render, cleanup }

    // Defer initialization until after render
    setTimeout(() => {
      const canvas = queryRequired(document, '#canvas', HTMLCanvasElement)
      const ctx2d = canvas.getContext('2d')
      if (!ctx2d) throw new Error('Could not get 2D context')

      const btnStart = hasStartPause ? queryRequired(document, '#btn-start', HTMLButtonElement) : null
      const btnStep = hasStep ? queryRequired(document, '#btn-step', HTMLButtonElement) : null
      const btnReset = hasReset ? queryRequired(document, '#btn-reset', HTMLButtonElement) : null
      const statsContainer = queryRequired(document, '.stats-panel', HTMLElement)

      const context: PageContext<S> = {
        canvas,
        ctx: ctx2d,
        btnStart,
        btnStep,
        btnReset,
        state,
        statsContainer,
      }

      // Wire up event handlers
      if (btnStart) {
        btnStart.addEventListener('click', () => {
          if (running) {
            running = false
            btnStart.textContent = 'Resume'
            methods.pause?.(context)
          } else {
            running = true
            btnStart.textContent = 'Pause'
            methods.start?.(context)
          }
        })
      }

      if (btnStep) {
        btnStep.addEventListener('click', () => {
          if (running && btnStart) {
            running = false
            btnStart.textContent = 'Resume'
            methods.pause?.(context)
          }
          methods.step?.(context)
          methods.draw(context)
        })
      }

      if (btnReset) {
        btnReset.addEventListener('click', () => {
          running = false
          if (btnStart) btnStart.textContent = 'Start'
          methods.reset(context)
          methods.draw(context)
        })
      }

      // Initialize and draw
      methods.init?.(context)
      methods.draw(context)
    }, 0)

    return page
  }
}

// ─── Animation Loop Helper ───────────────────────────────────────────────────

export interface AnimationOptions<S> {
  /** Called each frame with delta time in seconds */
  update(state: S, dt: number): void
  /** Called each frame to render */
  draw(ctx: PageContext<S>): void
  /** Check if animation should continue */
  isRunning(state: S): boolean
}

/**
 * Creates a requestAnimationFrame-based animation loop.
 * Handles starting, stopping, and cleanup automatically.
 */
export function createAnimationLoop<S>(
  context: PageContext<S>,
  options: AnimationOptions<S>
): {
  start: () => void
  stop: () => void
  isRunning: () => boolean
} {
  let animationId: number | null = null
  let lastTime = 0

  function tick(timestamp: number): void {
    if (!options.isRunning(context.state)) {
      animationId = null
      return
    }

    const dt = lastTime ? (timestamp - lastTime) / 1000 : 0
    lastTime = timestamp

    options.update(context.state, dt)
    options.draw(context)

    animationId = requestAnimationFrame(tick)
  }

  return {
    start() {
      if (animationId === null) {
        lastTime = 0
        animationId = requestAnimationFrame(tick)
      }
    },
    stop() {
      if (animationId !== null) {
        cancelAnimationFrame(animationId)
        animationId = null
      }
    },
    isRunning() {
      return animationId !== null
    },
  }
}

// ─── Stats Panel Helpers ────────────────────────────────────────────────────

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
