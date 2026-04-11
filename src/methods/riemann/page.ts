// ─── Riemann Page ────────────────────────────────────────────────────────────
// Main page factory for the Riemann integral method.

import { getInsideColor, getAmberColor, CANVAS_SIZE } from '../../colors'
import {
  createMethodPageFactory,
  statCard,
  legend,
  explanation,
  cleanupController,
} from '../base/page'
import { State, MAX_RECTS, createInitialState } from './types'
import { createRiemannController, StatsElements } from './controller'

// ─── Page Factory ─────────────────────────────────────────────────────────────
export const createRiemannPage = createMethodPageFactory<State>(
  {
    title: 'Riemann Integral',
    subtitle: 'The area under 4/(1+x²) from 0 to 1 equals π.',
    index: '08',
    canvasWidth: CANVAS_SIZE,
    canvasHeight: CANVAS_SIZE,
    controls: `
      <button class="btn primary" id="btn-start">Start</button>
      <button class="btn" id="btn-step">+5 Rectangles</button>
      <button class="btn" id="btn-reset" disabled>Reset</button>
    `,
    statsPanel: `
      ${statCard('π estimate (integral)', 'estimate', { valueClass: 'stat-value large', errorId: 'error' })}
      ${statCard('Rectangles', 'rects', { subtext: `of ${MAX_RECTS.toLocaleString()} max` })}
      ${legend([
        { color: getInsideColor(), text: 'Riemann rectangles' },
        { color: getAmberColor(), text: 'Curve y = 4/(1+x²)' },
      ])}
      ${explanation(
        'How it works',
        [
          'The integral of 4/(1+x²) from 0 to 1 equals exactly π. This is because the antiderivative is 4·arctan(x), and arctan(1) - arctan(0) = π/4.',
          'Riemann sums approximate this integral by dividing the area into rectangles. As the number of rectangles increases, the sum converges to π.',
        ],
        '∫₀¹ 4/(1+x²) dx = π'
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
        rects: $id('rects', HTMLElement),
        error: $id('error', HTMLElement),
      }

      // Create and store the controller
      const controller = createRiemannController(ctx, statsElements)

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
