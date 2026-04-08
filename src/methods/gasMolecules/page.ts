// ─── Gas Molecules Page ──────────────────────────────────────────────────────
// Main page factory for the gas molecules method.

import { fmt } from '../../utils'
import { CANVAS_SIZE } from '../../colors'
import { createMethodPageFactory, statCard, explanation, legend } from '../base/page'
import {
  State,
  MAX_PARTICLES,
  TICKS_PER_FRAME,
  CONTAINER_PAD,
  PARTICLE_RADIUS,
  C_PARTICLE,
  C_WALL,
  createInitialState,
  gaussianRandom,
  estimatePi,
  calculateAvgSpeed,
} from './types'
import { physicsStep } from './physics'
import { draw } from './rendering'

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
      const { canvas, ctx: canvasCtx } = ctx
      const $required = ctx.$required.bind(ctx)

      const btnStart = $required('#gm-start') as HTMLButtonElement
      const btnAdd = $required('#gm-add') as HTMLButtonElement
      const btnReset = $required('#gm-reset') as HTMLButtonElement
      const tempSlider = $required('#gm-temp') as HTMLInputElement
      const elEstimate = $required('#gm-estimate')
      const elParticles = $required('#gm-particles')
      const elAvgSpeed = $required('#gm-avg-speed')
      const elError = $required('#gm-error')
      const tempVal = $required('#gm-temp-val')

      function updateStats(): void {
        const piEstimate = estimatePi(ctx.state.particles, ctx.state.temperature)
        const error = Math.abs(piEstimate - Math.PI)
        const avgSpeed = calculateAvgSpeed(ctx.state.particles)

        elEstimate.textContent = ctx.state.particles.length < 10 ? '—' : fmt(piEstimate)
        elParticles.textContent = ctx.state.particles.length.toLocaleString()
        elAvgSpeed.textContent = avgSpeed.toFixed(2)

        if (ctx.state.particles.length >= 10) {
          elError.textContent = `Error: ${fmt(error)}`
          elError.className = 'stat-error ' + (error < 0.5 ? 'improving' : 'neutral')
        } else {
          elError.textContent = 'Error: —'
          elError.className = 'stat-error neutral'
        }
      }

      // Add a particle with random velocity based on temperature
      function addParticle(): void {
        const W = canvas.width - CONTAINER_PAD * 2 - PARTICLE_RADIUS * 2
        const H = canvas.height - CONTAINER_PAD * 2 - PARTICLE_RADIUS * 2

        // Maxwell-Boltzmann uses Gaussian velocity components
        const sigma = Math.sqrt(ctx.state.temperature)
        const vx = gaussianRandom() * sigma
        const vy = gaussianRandom() * sigma

        ctx.state.particles.push({
          x: CONTAINER_PAD + PARTICLE_RADIUS + Math.random() * W,
          y: CONTAINER_PAD + PARTICLE_RADIUS + Math.random() * H,
          vx,
          vy,
        })
      }

      function addParticles(count: number): void {
        for (let i = 0; i < count && ctx.state.particles.length < MAX_PARTICLES; i++) {
          addParticle()
        }
        draw(canvasCtx, ctx.state)
        updateStats()
      }

      // Animation tick
      function tick(): void {
        if (!ctx.state.running) return

        for (let i = 0; i < TICKS_PER_FRAME; i++) {
          physicsStep(
            ctx.state.particles,
            canvas.width,
            canvas.height,
            ctx.state.temperature,
            ctx.state.steps
          )
          ctx.state.steps++
        }

        draw(canvasCtx, ctx.state)
        updateStats()
        ctx.state.rafId = requestAnimationFrame(tick)
      }

      function start(): void {
        if (ctx.state.particles.length === 0) {
          addParticles(50)
        }
        ctx.state.running = true
        btnStart.disabled = true
        btnReset.disabled = false
        btnStart.textContent = 'Running…'
        ctx.state.rafId = requestAnimationFrame(tick)
      }

      function reset(): void {
        ctx.state.running = false
        if (ctx.state.rafId !== null) cancelAnimationFrame(ctx.state.rafId)
        ctx.state.particles = []
        ctx.state.steps = 0
        draw(canvasCtx, ctx.state)
        updateStats()
        btnStart.disabled = false
        btnStart.textContent = 'Start'
        btnReset.disabled = true
      }

      function updateTemperature(): void {
        ctx.state.temperature = parseFloat(tempSlider.value) || 1
        updateStats()
      }

      // Initial draw
      draw(canvasCtx, ctx.state)
      updateStats()

      // Event handlers
      btnStart.addEventListener('click', () => {
        if (!ctx.state.running) start()
      })

      btnAdd.addEventListener('click', () => {
        addParticles(10)
        btnReset.disabled = false
      })

      btnReset.addEventListener('click', reset)

      tempSlider.addEventListener('input', () => {
        tempVal.textContent = tempSlider.value
        updateTemperature()
      })
    },

    cleanup(ctx) {
      ctx.state.running = false
      if (ctx.state.rafId !== null) {
        cancelAnimationFrame(ctx.state.rafId)
        ctx.state.rafId = null
      }
    },
  }
)
