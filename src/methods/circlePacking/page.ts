// ─── Circle Packing Page ─────────────────────────────────────────────────────
// Main page factory for the circle packing method.

import { getInsideColor, CANVAS_SIZE } from '../../colors'
import {
  createMethodPageFactory,
  statCard,
  explanation,
  legend,
  cleanupController,
} from '../base/page'
import { State, MAX_CIRCLES, createInitialState } from './types'
import { createCirclePackingController, StatsElements } from './controller'

// ─── Page Factory ────────────────────────────────────────────────────────────
export const createCirclePackingPage = createMethodPageFactory<State>(
  {
    title: 'Circle Packing',
    subtitle: 'The area of circles relates to π through covered area.',
    index: '13',
    canvasWidth: CANVAS_SIZE,
    canvasHeight: CANVAS_SIZE,
    controls: `
      <button id="cp-start" class="btn primary">Start</button>
      <button id="cp-step" class="btn">+3 Circles</button>
      <button id="cp-reset" class="btn" disabled>Reset</button>
    `,
    statsPanel: `
      ${statCard('π estimate', 'cp-estimate', { valueClass: 'stat-value large', errorId: 'cp-error' })}
      ${statCard('Circles placed', 'cp-circles', { subtext: `of ${MAX_CIRCLES} max` })}
      ${statCard('Area coverage', 'cp-covered', { subtext: 'jamming limit ~55%' })}
      ${legend([{ color: getInsideColor(), text: 'Placed circles' }])}
      ${explanation(
        'How it works',
        [
          'We place circles randomly without overlap (random sequential adsorption). The covered area equals π times the sum of squared radii (for non-overlapping circles).',
          'By measuring the actual covered area and dividing by Σr², we can estimate the value of π.',
          'The maximum packing density (jamming limit) for random circle placement is approximately 54.7%.',
        ],
        'Area = π × Σr²'
      )}
    `,
  },
  createInitialState(),
  {
    init(ctx) {
      const { $required } = ctx

      // Get stats element references
      const statsElements: StatsElements = {
        estimate: $required('#cp-estimate'),
        circles: $required('#cp-circles'),
        covered: $required('#cp-covered'),
        error: $required('#cp-error'),
      }

      // Create and store the controller
      const controller = createCirclePackingController(ctx, statsElements)

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
