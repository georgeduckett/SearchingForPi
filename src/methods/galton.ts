import { fmt } from '../utils'
import { C_BG, C_INSIDE, C_OUTSIDE, C_AMBER, C_TEXT_MUTED, CANVAS_SIZE, PREVIEW_SIZE } from '../colors'
import { clearCanvas } from './base/canvas'
import { createMethodPageFactory, statCard, legend, explanation } from './base/page'

// ─── Constants ───────────────────────────────────────────────────────────────
const ROWS = 12
const NUM_BINS = ROWS + 1
const MAX_BALLS = 500
const BALL_RADIUS = 4
const PEG_RADIUS = 3

// ─── Colors ──────────────────────────────────────────────────────────────────
const C_BALL = C_INSIDE
const C_PEG = '#666'
const C_BIN = C_OUTSIDE

// ─── Preview Renderer ────────────────────────────────────────────────────────
export function drawPreview(ctx: CanvasRenderingContext2D, _time: number): void {
  const s = PREVIEW_SIZE
  clearCanvas(ctx, s, s)

  ctx.fillStyle = C_TEXT_MUTED
  const rows = 5
  for (let row = 0; row < rows; row++) {
    for (let peg = 0; peg <= row; peg++) {
      const x = s / 2 + (peg - row / 2) * 16
      const y = 20 + row * 18
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.fillStyle = C_INSIDE
  const bins = [2, 4, 6, 4, 2]
  const maxH = 30
  for (let i = 0; i < 5; i++) {
    const h = (bins[i] / 6) * maxH
    ctx.fillRect(s / 2 + (i - 2) * 16 - 6, s - 15 - h, 12, h)
  }

  ctx.strokeStyle = C_AMBER
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(s / 2 - 40, s - 15)
  ctx.quadraticCurveTo(s / 2, s - 55, s / 2 + 40, s - 15)
  ctx.stroke()
}

// ─── State ───────────────────────────────────────────────────────────────────
interface Ball {
  x: number
  y: number
  vx: number
  vy: number
  active: boolean
  bin: number | null
}

interface State {
  balls: Ball[]
  bins: number[]
  dropped: number
  running: boolean
  dropping: boolean
  rafId: number | null
}

// ─── Page Factory ─────────────────────────────────────────────────────────────
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
        { color: C_AMBER, text: 'Gaussian reference' },
      ])}
      ${explanation('How it works', [
        'The Galton board demonstrates the central limit theorem: balls falling through pegs form a binomial distribution that approaches a Gaussian (normal) distribution.',
        "Stirling's approximation shows factorials relate to π. We estimate π by comparing the peak height to the theoretical Gaussian: peak × √(2πσ²) ≈ total.",
      ], 'n! ≈ √(2πn)(n/e)ⁿ')}
    `,
  },
  {
    balls: [],
    bins: Array(NUM_BINS).fill(0),
    dropped: 0,
    running: false,
    dropping: false,
    rafId: null,
  },
  {
    init(ctx) {
      const { ctx: ctx2d, state, $id } = ctx

      // Get button references
      const btnStart = $id('btn-start', HTMLButtonElement)
      const btnDrop = $id('btn-drop', HTMLButtonElement)
      const btnReset = $id('btn-reset', HTMLButtonElement)
      const elEstimate = $id('estimate', HTMLElement)
      const elDropped = $id('dropped', HTMLElement)
      const elPeak = $id('peak', HTMLElement)
      const elError = $id('error', HTMLElement)

      // Physics constants
      const GRAVITY = 0.25
      const RESTITUTION = 0.6
      const FRICTION = 0.99
      const PEG_DAMPING = 0.65

      // Layout
      const PEG_START_Y = 50
      const PEG_SPACING_Y = 30
      const PEG_SPACING_X = 32

      // Draw function
      function draw(): void {
        const W = CANVAS_SIZE
        const H = CANVAS_SIZE

        ctx2d.fillStyle = C_BG
        ctx2d.fillRect(0, 0, W, H)

        const centerX = W / 2

        // Draw bin separators
        ctx2d.strokeStyle = C_BIN
        ctx2d.lineWidth = 2
        const binY = PEG_START_Y + ROWS * PEG_SPACING_Y
        const binWidth = PEG_SPACING_X
        const binStartX = centerX - (NUM_BINS / 2) * binWidth

        for (let i = 0; i <= NUM_BINS; i++) {
          const x = binStartX + i * binWidth
          ctx2d.beginPath()
          ctx2d.moveTo(x, binY)
          ctx2d.lineTo(x, H - 20)
          ctx2d.stroke()
        }

        // Draw bin floor
        ctx2d.beginPath()
        ctx2d.moveTo(binStartX, H - 20)
        ctx2d.lineTo(binStartX + NUM_BINS * binWidth, H - 20)
        ctx2d.stroke()

        // Draw pegs
        ctx2d.fillStyle = C_PEG
        for (let row = 0; row < ROWS; row++) {
          const pegsInRow = row + 1
          const startY = PEG_START_Y + row * PEG_SPACING_Y
          const rowStartX = centerX - (pegsInRow / 2) * PEG_SPACING_X

          for (let peg = 0; peg < pegsInRow; peg++) {
            const x = rowStartX + (peg + 0.5) * PEG_SPACING_X
            ctx2d.beginPath()
            ctx2d.arc(x, startY, PEG_RADIUS, 0, Math.PI * 2)
            ctx2d.fill()
          }
        }

        // Draw bin counts as bars
        const maxBin = Math.max(...state.bins, 1)
        const barMaxHeight = H - binY - 40
        ctx2d.globalAlpha = 0.5
        ctx2d.fillStyle = C_BALL
        for (let i = 0; i < NUM_BINS; i++) {
          const count = state.bins[i]
          const barHeight = (count / maxBin) * barMaxHeight
          const x = binStartX + i * binWidth + 2
          ctx2d.fillRect(x, H - 20 - barHeight, binWidth - 4, barHeight)
        }
        ctx2d.globalAlpha = 1

        // Draw active balls
        ctx2d.fillStyle = C_BALL
        for (const ball of state.balls) {
          if (ball.active) {
            ctx2d.beginPath()
            ctx2d.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2)
            ctx2d.fill()
          }
        }

        // Gaussian overlay (reference)
        if (state.dropped > 10) {
          const sigma = Math.sqrt(ROWS / 4)
          const mu = NUM_BINS / 2
          ctx2d.strokeStyle = C_AMBER
          ctx2d.lineWidth = 2
          ctx2d.beginPath()

          for (let i = 0; i <= NUM_BINS; i += 0.5) {
            const gaussian = Math.exp(-((i - mu) ** 2) / (2 * sigma ** 2))
            const scaledHeight = gaussian * maxBin * barMaxHeight / (1 / Math.sqrt(2 * Math.PI * sigma ** 2))
            const x = binStartX + i * binWidth
            const y = H - 20 - Math.min(scaledHeight, barMaxHeight) * (maxBin > 1 ? 1 : 0)
            if (i === 0) ctx2d.moveTo(x, y)
            else ctx2d.lineTo(x, y)
          }
          ctx2d.stroke()
        }
      }

      // Estimate π using Stirling's approximation
      function estimatePi(): number {
        if (state.dropped < 10) return 0

        const total = state.bins.reduce((a, b) => a + b, 0)
        if (total === 0) return 0

        const peakBin = state.bins[Math.floor(NUM_BINS / 2)] || 0
        if (peakBin === 0) return 0

        let mean = 0
        let variance = 0
        for (let i = 0; i < NUM_BINS; i++) {
          mean += i * state.bins[i]
        }
        mean /= total

        for (let i = 0; i < NUM_BINS; i++) {
          variance += state.bins[i] * (i - mean) ** 2
        }
        variance /= total

        const piEstimate = (total ** 2) / (2 * variance * peakBin ** 2)
        return piEstimate
      }

      function updateStats(): void {
        const piEstimate = estimatePi()
        const peak = Math.max(...state.bins)
        const error = Math.abs(piEstimate - Math.PI)

        elEstimate.textContent = state.dropped < 10 ? '—' : fmt(piEstimate)
        elDropped.textContent = state.dropped.toLocaleString()
        elPeak.textContent = peak.toLocaleString()
        if (state.dropped >= 10) {
          elError.textContent = `Error: ${fmt(error)}`
          elError.className = 'stat-error ' + (error < 1 ? 'improving' : 'neutral')
        } else {
          elError.textContent = 'Error: —'
          elError.className = 'stat-error neutral'
        }
      }

      function dropBall(): void {
        const centerX = CANVAS_SIZE / 2
        state.balls.push({
          x: centerX + (Math.random() - 0.5) * 8,
          y: 15 + Math.random() * 10,
          vx: (Math.random() - 0.5) * 0.3,
          vy: Math.random() * 0.5,
          active: true,
          bin: null
        })
      }

      function tick(): void {
        const W = CANVAS_SIZE
        const H = CANVAS_SIZE
        const centerX = W / 2

        let activeBalls = false

        for (const ball of state.balls) {
          if (!ball.active) continue
          activeBalls = true

          ball.vy += GRAVITY
          ball.vx *= FRICTION
          ball.vy *= FRICTION
          ball.x += ball.vx
          ball.y += ball.vy

          // Check peg collisions
          for (let row = 0; row < ROWS; row++) {
            const pegsInRow = row + 1
            const pegY = PEG_START_Y + row * PEG_SPACING_Y
            const rowStartX = centerX - (pegsInRow / 2) * PEG_SPACING_X

            for (let peg = 0; peg < pegsInRow; peg++) {
              const pegX = rowStartX + (peg + 0.5) * PEG_SPACING_X
              const dx = ball.x - pegX
              const dy = ball.y - pegY
              const dist = Math.sqrt(dx * dx + dy * dy)

              if (dist < BALL_RADIUS + PEG_RADIUS && dist > 0) {
                const nx = dx / dist
                const ny = dy / dist
                ball.x = pegX + nx * (BALL_RADIUS + PEG_RADIUS + 1)
                ball.y = pegY + ny * (BALL_RADIUS + PEG_RADIUS + 1)
                const dotProduct = ball.vx * nx + ball.vy * ny
                ball.vx = (ball.vx - 2 * dotProduct * nx) * RESTITUTION * PEG_DAMPING
                ball.vy = (ball.vy - 2 * dotProduct * ny) * RESTITUTION * PEG_DAMPING
                ball.vy = Math.max(ball.vy, GRAVITY * 0.5)
              }
            }
          }

          // Check if in bin
          const binY = PEG_START_Y + ROWS * PEG_SPACING_Y
          if (ball.y > binY && ball.y < H - 20) {
            const binStartX = centerX - (NUM_BINS / 2) * PEG_SPACING_X
            const bin = Math.floor((ball.x - binStartX) / PEG_SPACING_X)
            if (bin >= 0 && bin < NUM_BINS) {
              ball.active = false
              ball.bin = bin
              state.bins[bin]++
            }
          }

          if (ball.y > H || ball.x < 0 || ball.x > W) {
            ball.active = false
          }
        }

        draw()
        updateStats()

        if (state.dropping && state.dropped < MAX_BALLS) {
          if (Math.random() < 0.1) {
            dropBall()
            state.dropped++
          }
        }

        if (activeBalls || state.dropping) {
          state.rafId = requestAnimationFrame(tick)
        } else {
          state.running = false
          btnStart.textContent = 'Start'
          btnStart.disabled = state.dropped >= MAX_BALLS
        }
      }

      function start(): void {
        state.running = true
        state.dropping = true
        btnStart.disabled = true
        btnReset.disabled = false
        btnStart.textContent = 'Running…'
        state.rafId = requestAnimationFrame(tick)
      }

      function dropOne(): void {
        if (state.dropped >= MAX_BALLS) return
        dropBall()
        state.dropped++
        if (!state.running) {
          state.running = true
          state.dropping = false
          state.rafId = requestAnimationFrame(tick)
        }
        btnReset.disabled = false
      }

      function reset(): void {
        state.running = false
        state.dropping = false
        if (state.rafId !== null) cancelAnimationFrame(state.rafId)
        state.balls = []
        state.bins = Array(NUM_BINS).fill(0)
        state.dropped = 0
        draw()
        updateStats()
        btnStart.disabled = false
        btnStart.textContent = 'Start'
        btnReset.disabled = true
      }

      // Initial draw
      draw()
      updateStats()

      // Wire up buttons
      btnStart.addEventListener('click', () => {
        if (!state.running && state.dropped < MAX_BALLS) start()
      })
      btnDrop.addEventListener('click', dropOne)
      btnReset.addEventListener('click', reset)
    },

    cleanup(ctx) {
      ctx.state.running = false
      ctx.state.dropping = false
      if (ctx.state.rafId !== null) {
        cancelAnimationFrame(ctx.state.rafId)
        ctx.state.rafId = null
      }
    },
  }
)
