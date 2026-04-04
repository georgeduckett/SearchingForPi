import type { Page } from '../../router'
import { queryRequired } from '../../utils'

// Re-export types and functions from split modules
export { createAnimationLoop, type AnimationOptions, type AnimationLoop } from './animation'
export {
  statCard,
  statsRow,
  statsProgressBar,
  updateStat,
  updateProgress,
  legend,
  legendItem,
  explanation,
} from './stats'

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
  /** Additional control buttons HTML */
  extraControls?: string
  /** Additional stats elements HTML */
  extraStats?: string
}

export interface MethodPageOptions {
  /** Title displayed in the header */
  title: string
  /** Subtitle/description */
  subtitle?: string
  /** Index label (e.g., "01") */
  index?: string
  /** Canvas width (default: 560) */
  canvasWidth?: number
  /** Canvas height (default: 560) */
  canvasHeight?: number
  /** Custom controls HTML (replaces default buttons) */
  controls?: string
  /** Stats panel content HTML */
  statsPanel: string
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

export interface MethodPageContext<S> {
  /** The canvas element */
  canvas: HTMLCanvasElement
  /** The 2D rendering context */
  ctx: CanvasRenderingContext2D
  /** The page state */
  state: S
  /** Stats panel element */
  statsPanel: HTMLElement
  /** Query an element within the page by selector */
  $(selector: string): HTMLElement
  /** Query a required element within the page, throws if not found */
  $required(selector: string): HTMLElement
  /** Query a required element by ID */
  $id<T extends HTMLElement>(id: string, ctor: new () => T): T
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

export interface MethodPageMethods<S> {
  /** Called once to initialize the page after DOM is ready */
  init?(ctx: MethodPageContext<S>): void
  /** Draw the current state to the canvas */
  draw?(ctx: MethodPageContext<S>): void
  /** Start/resume the animation */
  start?(ctx: MethodPageContext<S>): void
  /** Pause the animation */
  pause?(ctx: MethodPageContext<S>): void
  /** Perform a single step */
  step?(ctx: MethodPageContext<S>): void
  /** Reset to initial state */
  reset?(ctx: MethodPageContext<S>): void
  /** Cleanup when page is destroyed */
  cleanup?(ctx: MethodPageContext<S>): void
}

// ─── Simple Page Factory ─────────────────────────────────────────────────────

/**
 * Creates a simple page factory with standard layout.
 * Best for pages with basic canvas + controls + stats layout.
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

// ─── Method Page Factory ─────────────────────────────────────────────────────

/**
 * Creates a method page factory with the standard viz-layout structure.
 * This is the two-column layout with canvas on left and stats/info on right.
 */
export function createMethodPageFactory<S>(
  options: MethodPageOptions,
  initialState: S,
  methods: MethodPageMethods<S>
): () => Page {
  const {
    title,
    subtitle,
    index,
    canvasWidth = 560,
    canvasHeight = 560,
    controls = '<button class="btn primary" id="btn-start">Start</button><button class="btn" id="btn-step">Step</button><button class="btn" id="btn-reset" disabled>Reset</button>',
    statsPanel,
  } = options

  return function pageFactory(): Page {
    const state: S = JSON.parse(JSON.stringify(initialState))
    let animationId: number | null = null

    function render(): HTMLElement {
      const page = document.createElement('div')
      page.className = 'page'

      page.innerHTML = `
      <header class="page-header">
        ${index ? `<span class="page-index">Method ${index}</span>` : ''}
        <h2 class="page-title">${title}</h2>
        ${subtitle ? `<p class="page-subtitle">${subtitle}</p>` : ''}
      </header>

      <div class="viz-layout">
        <div>
          <div class="canvas-wrapper">
            <canvas id="canvas" width="${canvasWidth}" height="${canvasHeight}"></canvas>
          </div>
          <div style="margin-top:14px" class="controls">
            ${controls}
          </div>
        </div>

        <div class="stats-panel">
          ${statsPanel}
        </div>
      </div>
      `

      return page
    }

    function cleanup(): void {
      if (animationId !== null) {
        cancelAnimationFrame(animationId)
        animationId = null
      }

      const ctx: MethodPageContext<S> = {
        canvas: null as unknown as HTMLCanvasElement,
        ctx: null as unknown as CanvasRenderingContext2D,
        state,
        statsPanel: null as unknown as HTMLElement,
        $: () => null as unknown as HTMLElement,
        $required: () => null as unknown as HTMLElement,
        $id: () => null as unknown as HTMLElement as any,
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

      const statsPanelEl = queryRequired(document, '.stats-panel', HTMLElement)

      // Helper functions for querying elements
      const $ = (selector: string): HTMLElement =>
        document.querySelector(selector) as HTMLElement
      const $required = (selector: string): HTMLElement =>
        queryRequired(document, selector, HTMLElement)
      const $id = <T extends HTMLElement>(id: string, ctor: new () => T): T =>
        queryRequired(document, `#${id}`, ctor)

      const context: MethodPageContext<S> = {
        canvas,
        ctx: ctx2d,
        state,
        statsPanel: statsPanelEl,
        $,
        $required,
        $id,
      }

      // Initialize and draw
      methods.init?.(context)
      methods.draw?.(context)
    }, 0)

    return page
  }
}
