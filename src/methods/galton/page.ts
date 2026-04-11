// ─── Galton Board Page ───────────────────────────────────────────────────────
// Main page factory for the Galton board method.

import { getInsideColor, getAmberColor, CANVAS_SIZE } from '../../colors'
import {
  createMethodPageFactory,
  statCard,
  legend,
  explanation,
  cleanupController,
} from '../base/page'
import { State, MAX_BALLS, createInitialState } from './types'
import { createGaltonController, StatsElements } from './controller'

// ─── Colors for UI ───────────────────────────────────────────────────────────
const C_BALL = getInsideColor()

// ─── Page Factory ────────────────────────────────────────────────────────────
export const createGaltonPage = createMethodPageFactory<State>(
  {
    title: 'Galton Board',
    subtitle: "The normal distribution connects to π through Stirling's formula.",
    index: '12',
    canvasWidth: CANVAS_SIZE,
    canvasHeight: CANVAS_SIZE,
    controls: `
      <button class="btn primary" id="btn-start">Auto Drop</button>
      <button class="btn" id="btn-drop">Drop One</button>
      <button class="btn" id="btn-reset" disabled>Reset</button>
    `,
    statsPanel: `
      ${statCard('π estimate', 'estimate', { valueClass: 'stat-value large', errorId: 'error' })}
      ${statCard('Balls dropped', 'dropped', { subtext: `of ${MAX_BALLS} max` })}
      ${statCard('Peak bin count', 'peak')}
      ${legend([
        { color: C_BALL, text: 'Dropped balls' },
        { color: getAmberColor(), text: 'Gaussian reference' },
      ])}
      ${explanation(
        'How it works',
        [
          'The Galton board demonstrates the central limit theorem: balls falling through pegs form a binomial distribution that approaches a Gaussian (normal) distribution.',
          "Stirling's approximation shows factorials relate to π. We estimate π by comparing the peak height to the theoretical Gaussian: peak × √(2πσ²) ≈ total.",
        ],
        'n! ≈ √(2πn)(n/e)ⁿ'
      )}
    `,
  },
  createInitialState(),
  {
    init(ctx) {
      const { $id } = ctx

      // Get stats element references
      const statsElements: StatsElements = {
        estimate: $id('estimate', HTMLElement),
        dropped: $id('dropped', HTMLElement),
        peak: $id('peak', HTMLElement),
        error: $id('error', HTMLElement),
      }

      // Create and store the controller
      const controller = createGaltonController(ctx, statsElements)

      // Store controller for cleanup
      ctx.state._controller = controller
    },

    draw(_ctx) {
      // Drawing is handled in init and animation loop
    },

    cleanup(ctx) {
      cleanupController(ctx.state)
    },
  }
)
