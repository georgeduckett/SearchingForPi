// ─── Simple Page Factory ─────────────────────────────────────────────────────
// Creates a simple page factory with standard layout.
// Best for pages with basic canvas + controls + stats layout.

import type { Page } from '../../../router'
import type { PageOptions, PageContext, PageMethods } from './types'
import {
  buildPageHeader,
  buildCanvas,
  buildControlButtons,
  buildControlsContainer,
  buildStatsPanel,
  buildSimplePageLayout,
} from './templates'
import { createAnimationLifecycle, cancelAnimation, cloneState, deferInit } from './lifecycle'
import {
  getCanvasContext,
  getRequiredButton,
  getRequiredElement,
  wireStartPauseButton,
  wireStepButton,
  wireResetButton,
} from './dom'

/**
 * Creates a simple page factory with standard layout.
 * Best for pages with basic canvas + controls + stats layout.
 *
 * @example
 * ```ts
 * const createMyPage = createPageFactory<State>(
 *   { title: 'My Page', index: '01' },
 *   { count: 0 },
 *   {
 *     draw(ctx) { /* render canvas *\/ },
 *     reset(ctx) { ctx.state.count = 0 },
 *   }
 * )
 * ```
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
    // State and lifecycle management
    const state = cloneState(initialState)
    const lifecycle = createAnimationLifecycle()

    // Build HTML templates
    const headerHtml = buildPageHeader({ title, subtitle, index })
    const canvasHtml = buildCanvas({ width: canvasWidth, height: canvasHeight })
    const buttonsHtml = buildControlButtons({
      hasStartPause,
      hasStep,
      hasReset,
      extraControls,
    })
    const controlsHtml = buildControlsContainer(buttonsHtml)
    const statsHtml = buildStatsPanel(extraStats)

    // Build complete page HTML
    const pageHtml = buildSimplePageLayout({
      header: headerHtml,
      canvas: canvasHtml,
      controls: controlsHtml,
      stats: statsHtml,
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
    deferInit(() => {
      // Get canvas and context
      const { canvas, ctx: ctx2d } = getCanvasContext()

      // Get button references
      const btnStart = hasStartPause ? getRequiredButton('btn-start') : null
      const btnStep = hasStep ? getRequiredButton('btn-step') : null
      const btnReset = hasReset ? getRequiredButton('btn-reset') : null
      const statsContainer = getRequiredElement('.stats-panel', HTMLElement)

      // Build context
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
        wireStartPauseButton(
          btnStart,
          {
            onStart: () => methods.start?.(context),
            onPause: () => methods.pause?.(context),
          },
          () => lifecycle.running,
          value => {
            lifecycle.running = value
          }
        )
      }

      if (btnStep) {
        wireStepButton(
          btnStep,
          () => {
            methods.step?.(context)
            methods.draw(context)
          },
          {
            getRunning: () => lifecycle.running,
            setRunning: value => {
              lifecycle.running = value
            },
            startPauseButton: btnStart,
          }
        )
      }

      if (btnReset) {
        wireResetButton(
          btnReset,
          () => {
            lifecycle.running = false
            methods.reset(context)
            methods.draw(context)
          },
          {
            startPauseButton: btnStart,
          }
        )
      }

      // Initialize and draw
      methods.init?.(context)
      methods.draw(context)
    })

    return page
  }
}
