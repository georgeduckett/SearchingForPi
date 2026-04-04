import { fmt, isCoprime } from '../utils'
import { C_BG, C_INSIDE, C_OUTSIDE, C_TEXT_MUTED, C_AMBER, CANVAS_SIZE, PREVIEW_SIZE } from '../colors'
import { clearCanvas } from './base/canvas'
import { createMethodPageFactory, statCard, legend, explanation } from './base/page'

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_PAIRS = 5000
const PAIRS_PER_TICK = 20
const GRID_SIZE = 50

// Method-specific colors
const C_COPRIME = C_INSIDE
const C_NOT_COPRIME = C_OUTSIDE

// ─── Preview Renderer ────────────────────────────────────────────────────────
export function drawPreview(ctx: CanvasRenderingContext2D, _time: number): void {
  const s = PREVIEW_SIZE
  clearCanvas(ctx, s, s)

  const n = 10
  const cell = (s - 20) / n
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= n; j++) {
      const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
      const isCoprime = gcd(i, j) === 1
      ctx.fillStyle = isCoprime ? C_INSIDE : C_TEXT_MUTED
      ctx.globalAlpha = isCoprime ? 0.8 : 0.2
      ctx.fillRect(10 + (i - 1) * cell, 10 + (j - 1) * cell, cell - 1, cell - 1)
    }
  }
  ctx.globalAlpha = 1

  ctx.fillStyle = C_AMBER
  ctx.font = '10px monospace'
  ctx.textAlign = 'right'
  ctx.fillText('P = 6/π²', s - 10, s - 5)
}

// ─── State ───────────────────────────────────────────────────────────────────
interface Pair {
  a: number
  b: number
  coprime: boolean
}

interface State {
  pairs: Pair[]
  coprimeCount: number
  totalPairs: number
  running: boolean
  rafId: number | null
}

// ─── Page Factory ─────────────────────────────────────────────────────────────
export const createCoprimalityPage = createMethodPageFactory<State>(
  {
    title: 'Coprimality',
    subtitle: 'Two random numbers are coprime with probability 6/π².',
    index: '11',
    canvasWidth: CANVAS_SIZE,
    canvasHeight: CANVAS_SIZE,
    controls: `
      <button class="btn primary" id="btn-start">Start</button>
      <button class="btn" id="btn-step">+20 Pairs</button>
      <button class="btn" id="btn-reset" disabled>Reset</button>
    `,
    statsPanel: `
      ${statCard('π estimate √(6/P)', 'estimate', { valueClass: 'stat-value large', errorId: 'error' })}
      ${statCard('Pairs tested', 'pairs', { subtext: `of ${MAX_PAIRS.toLocaleString()} max` })}
      ${statCard('Coprime pairs', 'coprime', { subtext: '→ ~60.8% expected' })}
      ${legend([
        { color: C_COPRIME, text: 'Coprime (GCD = 1)' },
        { color: C_NOT_COPRIME, text: 'Not coprime (GCD > 1)' },
      ])}
      ${explanation('How it works', [
        'Two random positive integers are coprime (share no common factors other than 1) with probability 6/π².',
        'By generating many random pairs and counting coprimes, we can estimate π: π ≈ √(6 / P(coprime)).',
        'The grid visualizes pairs by their values modulo 50, coloring each by whether they\'re coprime.',
      ], 'P(coprime) = 6/π² ≈ 0.6079')}
    `,
  },
  {
    pairs: [],
    coprimeCount: 0,
    totalPairs: 0,
    running: false,
    rafId: null,
  },
  {
    init(ctx) {
      const { ctx: ctx2d, state, $id } = ctx

      // Get button references
      const btnStart = $id('btn-start', HTMLButtonElement)
      const btnStep = $id('btn-step', HTMLButtonElement)
      const btnReset = $id('btn-reset', HTMLButtonElement)
      const elEstimate = $id('estimate', HTMLElement)
      const elPairs = $id('pairs', HTMLElement)
      const elCoprime = $id('coprime', HTMLElement)
      const elError = $id('error', HTMLElement)

      // Draw function
      function draw(): void {
        const W = CANVAS_SIZE
        const H = CANVAS_SIZE

        ctx2d.fillStyle = C_BG
        ctx2d.fillRect(0, 0, W, H)

        const cellSize = Math.min((W - 40) / GRID_SIZE, (H - 40) / GRID_SIZE)
        const offsetX = (W - GRID_SIZE * cellSize) / 2
        const offsetY = (H - GRID_SIZE * cellSize) / 2

        // Draw grid background
        ctx2d.strokeStyle = '#333'
        ctx2d.lineWidth = 0.5
        for (let i = 0; i <= GRID_SIZE; i++) {
          ctx2d.beginPath()
          ctx2d.moveTo(offsetX + i * cellSize, offsetY)
          ctx2d.lineTo(offsetX + i * cellSize, offsetY + GRID_SIZE * cellSize)
          ctx2d.stroke()
          ctx2d.beginPath()
          ctx2d.moveTo(offsetX, offsetY + i * cellSize)
          ctx2d.lineTo(offsetX + GRID_SIZE * cellSize, offsetY + i * cellSize)
          ctx2d.stroke()
        }

        // Draw pairs that are coprime
        const maxDisplay = GRID_SIZE * GRID_SIZE
        const displayLimit = Math.min(state.pairs.length, maxDisplay)

        for (let i = 0; i < displayLimit; i++) {
          const pair = state.pairs[state.pairs.length - 1 - i]
          if (!pair) continue

          // Map to grid position
          const gridX = pair.a % GRID_SIZE
          const gridY = pair.b % GRID_SIZE
          const x = offsetX + gridX * cellSize
          const y = offsetY + gridY * cellSize

          ctx2d.fillStyle = pair.coprime ? C_COPRIME : C_NOT_COPRIME
          ctx2d.globalAlpha = 0.8
          ctx2d.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2)
        }
        ctx2d.globalAlpha = 1

        // Labels
        ctx2d.fillStyle = C_TEXT_MUTED
        ctx2d.font = '11px "JetBrains Mono", monospace'
        ctx2d.fillText('a', offsetX - 10, offsetY + GRID_SIZE * cellSize / 2)
        ctx2d.fillText('b', offsetX + GRID_SIZE * cellSize / 2 - 10, offsetY - 5)
      }

      // Estimate π from coprime probability
      function estimatePi(): number {
        if (state.totalPairs === 0) return 0
        const prob = state.coprimeCount / state.totalPairs
        // P(coprime) = 6/π², so π = √(6/P)
        return Math.sqrt(6 / prob)
      }

      function updateStats(): void {
        const piEstimate = estimatePi()
        const error = Math.abs(piEstimate - Math.PI)

        elEstimate.textContent = state.totalPairs === 0 ? '—' : fmt(piEstimate)
        elPairs.textContent = state.totalPairs.toLocaleString()
        elCoprime.textContent = state.coprimeCount.toLocaleString()
        elError.textContent = state.totalPairs === 0 ? 'Error: —' : `Error: ${fmt(error)}`
        elError.className = 'stat-error ' + (error < 0.1 || state.totalPairs < 100 ? 'neutral' : error < 0.5 ? 'improving' : 'neutral')
      }

      // Generate random pairs
      function generatePairs(count: number): void {
        for (let i = 0; i < count && state.totalPairs < MAX_PAIRS; i++) {
          const a = Math.floor(Math.random() * 10000) + 1
          const b = Math.floor(Math.random() * 10000) + 1
          const coprime = isCoprime(a, b)
          state.pairs.push({ a, b, coprime })
          if (coprime) state.coprimeCount++
          state.totalPairs++
        }
        draw()
        updateStats()
      }

      function tick(): void {
        if (!state.running) return
        if (state.totalPairs >= MAX_PAIRS) {
          state.running = false
          btnStart.textContent = 'Done'
          btnStart.disabled = true
          return
        }
        generatePairs(PAIRS_PER_TICK)
        state.rafId = requestAnimationFrame(tick)
      }

      function start(): void {
        state.running = true
        btnStart.disabled = true
        btnReset.disabled = false
        btnStart.textContent = 'Running…'
        state.rafId = requestAnimationFrame(tick)
      }

      function reset(): void {
        state.running = false
        if (state.rafId !== null) cancelAnimationFrame(state.rafId)
        state.pairs = []
        state.coprimeCount = 0
        state.totalPairs = 0
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
        if (!state.running && state.totalPairs < MAX_PAIRS) start()
      })

      btnStep.addEventListener('click', () => {
        if (!state.running) {
          generatePairs(PAIRS_PER_TICK)
          btnReset.disabled = false
        }
      })

      btnReset.addEventListener('click', reset)
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
