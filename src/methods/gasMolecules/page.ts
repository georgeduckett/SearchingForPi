// ─── Gas Molecules Page ──────────────────────────────────────────────────────
// Main page factory for the gas molecules method.

import { CANVAS_SIZE } from '../../colors'
import {
  createMethodPageFactory,
  statCard,
  explanation,
  legend,
  cleanupController,
} from '../base/page'
import { State, MAX_PARTICLES, C_PARTICLE, C_WALL, createInitialState } from './types'
import { createGasMoleculesController, StatsElements } from './controller'

// ─── Page Factory ─────────────────────────────────────────────────────────────
export const createGasMoleculesPage = createMethodPageFactory<State>(
  {
    title: 'Gas Molecules',
    subtitle: 'Maxwell-Boltzmann speed distribution relates to π.',
    index: '14',
    canvasWidth: CANVAS_SIZE,
    canvasHeight: CANVAS_SIZE,
    controls: `
      <button id="gm-start" class="btn primary">Start</button>
      <button id="gm-add" class="btn">+10 Particles</button>
      <button id="gm-reset" class="btn" disabled>Reset</button>
      <label style="margin-left:10px; color:var(--text-secondary)">
        Temp:
        <input type="range" id="gm-temp" min="0.2" max="3" step="0.1" value="1" style="width:80px; vertical-align:middle">
        <span id="gm-temp-val">1.0</span>
      </label>
    `,
    statsPanel: `
      ${statCard('π estimate 2<v>²/T', 'gm-estimate', { valueClass: 'stat-value large', errorId: 'gm-error' })}
      ${statCard('Particles', 'gm-particles', { subtext: `of ${MAX_PARTICLES} max` })}
      ${statCard('Average speed <v>', 'gm-avg-speed')}
      ${legend([
        { color: C_PARTICLE, text: 'Gas particles' },
        { color: C_WALL, text: 'Maxwell-Boltzmann curve' },
      ])}
      ${explanation(
        'How it works',
        [
          'In an ideal gas, the Maxwell-Boltzmann speed distribution gives the mean speed as √(πT/2) in normalized units.',
          'By simulating particles and measuring their average speed, we can estimate π: π = 2<v>²/T, where T is temperature.',
          'The histogram shows the actual speed distribution compared to the theoretical Maxwell-Boltzmann curve.',
        ],
        '<v> = √(πT/2)'
      )}
    `,
  },
  createInitialState(),
  {
    init(ctx) {
      const { $required } = ctx

      // Get stats element references
      const statsElements: StatsElements = {
        estimate: $required('#gm-estimate'),
        particles: $required('#gm-particles'),
        avgSpeed: $required('#gm-avg-speed'),
        error: $required('#gm-error'),
      }

      // Create and store the controller
      const controller = createGasMoleculesController(ctx, statsElements)

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
