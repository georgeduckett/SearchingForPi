// ─── Method Page Factory ─────────────────────────────────────────────────────
// Creates a method page factory with the standard viz-layout structure.
// This is the two-column layout with canvas on left and stats/info on right.

import type { Page } from '../../../router'
import type { MethodPageOptions, MethodPageContext, MethodPageMethods } from './types'
import {
  buildPageHeader,
  buildCanvasWithWrapper,
  buildControlsContainer,
  buildVizLayout,
} from './templates'
import { createAnimationLifecycle, cancelAnimation, cloneState, deferInit } from './lifecycle'
import {
  getCanvasContext,
  getStatsPanel,
  create$Helper,
  create$RequiredHelper,
  create$IdHelper,
} from './dom'

/**
 * Creates a method page factory with the standard viz-layout structure.
 * This is the two-column layout with canvas on left and stats/info on right.
 *
 * @example
 * ```ts
 * const createMyMethodPage = createMethodPageFactory<State>(
 *   {
 *     title: 'My Method',
 *     index: '01',
 *     statsPanel: `<div class="stat-card">...</div>`,
 *   },
 *   { count: 0 },
 *   {
 *     init(ctx) { /* wire up buttons *\/ },
 *     draw(ctx) { /* render canvas *\/ },
 *   }
 * )
 * ```
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
    // State and lifecycle management
    const state = cloneState(initialState)
    const lifecycle = createAnimationLifecycle()

    // Build HTML templates
    const headerHtml = buildPageHeader({
      title,
      subtitle,
      index,
      indexPrefix: 'Method ',
    })
    const canvasHtml = buildCanvasWithWrapper({
      width: canvasWidth,
      height: canvasHeight,
    })
    const controlsHtml = buildControlsContainer(controls, 'margin-top:14px')

    // Build complete page HTML using viz-layout
    const pageHtml = buildVizLayout({
      header: headerHtml,
      canvas: canvasHtml,
      controls: controlsHtml,
      stats: `<div class="stats-panel">${statsPanel}</div>`,
    })

    function render(): HTMLElement {
      const page = document.createElement('div')
      page.className = 'page'
      page.innerHTML = pageHtml
      return page
    }

    function cleanup(): void {
      cancelAnimation(lifecycle)

      // Create a minimal context for cleanup
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
    deferInit(() => {
      // Get canvas and context
      const { canvas, ctx: ctx2d } = getCanvasContext()

      // Get stats panel
      const statsPanelEl = getStatsPanel()

      // Create helper functions for querying elements
      const $ = create$Helper()
      const $required = create$RequiredHelper()
      const $id = create$IdHelper()

      // Build context
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
    })

    return page
  }
}
