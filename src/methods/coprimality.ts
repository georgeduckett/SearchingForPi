import type { Page } from '../router'
import { fmt, queryRequired, isCoprime, getCanvasContext2D } from '../utils'
import { C_BG, C_INSIDE, C_OUTSIDE, C_TEXT_MUTED, C_AMBER, CANVAS_SIZE, PREVIEW_SIZE } from '../colors'
import { clearCanvas } from './base/canvas'
import { getMethodIndex } from './definitions'

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
export function createCoprimalityPage(): Page {
  const state: State = { pairs: [], coprimeCount: 0, totalPairs: 0, running: false, rafId: null }
  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D
  let btnStart: HTMLButtonElement
  let btnStep: HTMLButtonElement
  let btnReset: HTMLButtonElement
  let elEstimate: HTMLElement
  let elPairs: HTMLElement
  let elCoprimeCount: HTMLElement
  let elError: HTMLElement

  // ── Draw the grid visualization ─────────────────────────────────────────────
  function draw(): void {
    const W = canvas.width
    const H = canvas.height

    ctx.fillStyle = C_BG
    ctx.fillRect(0, 0, W, H)

    const cellSize = Math.min((W - 40) / GRID_SIZE, (H - 40) / GRID_SIZE)
    const offsetX = (W - GRID_SIZE * cellSize) / 2
    const offsetY = (H - GRID_SIZE * cellSize) / 2

    // Draw grid background
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(offsetX + i * cellSize, offsetY)
      ctx.lineTo(offsetX + i * cellSize, offsetY + GRID_SIZE * cellSize)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(offsetX, offsetY + i * cellSize)
      ctx.lineTo(offsetX + GRID_SIZE * cellSize, offsetY + i * cellSize)
      ctx.stroke()
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

      ctx.fillStyle = pair.coprime ? C_COPRIME : C_NOT_COPRIME
      ctx.globalAlpha = 0.8
      ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2)
    }
    ctx.globalAlpha = 1

    // Labels
    ctx.fillStyle = C_TEXT_MUTED
    ctx.font = '11px "JetBrains Mono", monospace'
    ctx.fillText('a', offsetX - 10, offsetY + GRID_SIZE * cellSize / 2)
    ctx.fillText('b', offsetX + GRID_SIZE * cellSize / 2 - 10, offsetY - 5)
  }

  // ── Estimate π from coprime probability ─────────────────────────────────────
  function estimatePi(): number {
    if (state.totalPairs === 0) return 0
    const prob = state.coprimeCount / state.totalPairs
    // P(coprime) = 6/π², so π = √(6/P)
    return Math.sqrt(6 / prob)
  }

  // ── Update stats display ────────────────────────────────────────────────────
  function updateStats(): void {
    const piEstimate = estimatePi()
    const error = Math.abs(piEstimate - Math.PI)

    elEstimate.textContent = state.totalPairs === 0 ? '—' : fmt(piEstimate)
    elPairs.textContent = state.totalPairs.toLocaleString()
    elCoprimeCount.textContent = state.coprimeCount.toLocaleString()
    elError.textContent = state.totalPairs === 0 ? 'Error: —' : `Error: ${fmt(error)}`
    elError.className = 'stat-error ' + (error < 0.1 || state.totalPairs < 100 ? 'neutral' : error < 0.5 ? 'improving' : 'neutral')
  }

  // ── Generate random pairs ───────────────────────────────────────────────────
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

  // ── Build DOM ─────────────────────────────────────────────────────────────
  function render(): HTMLElement {
    const page = document.createElement('div')
    page.className = 'page'

    page.innerHTML = `
      <header class="page-header">
        <span class="page-index">Method ${getMethodIndex('coprimality')}</span>
        <h2 class="page-title">Coprimality</h2>
        <p class="page-subtitle">
          Two random numbers are coprime with probability 6/π².
        </p>
      </header>

      <div class="viz-layout">
        <div>
          <div class="canvas-wrapper">
            <canvas id="co-canvas" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"></canvas>
          </div>
          <div style="margin-top:14px" class="controls">
            <button id="co-start" class="btn primary">Start</button>
            <button id="co-step" class="btn">+20 Pairs</button>
            <button id="co-reset" class="btn" disabled>Reset</button>
          </div>
        </div>

        <div class="stats-panel">
          <div class="stat-card">
            <div class="stat-label">π estimate √(6/P)</div>
            <div class="stat-value large" id="co-estimate">—</div>
            <div class="stat-error neutral" id="co-error">Error: —</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Pairs tested</div>
            <div class="stat-value" id="co-pairs">0</div>
            <div class="stat-sub">of ${MAX_PAIRS.toLocaleString()} max</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Coprime pairs</div>
            <div class="stat-value" id="co-coprime-count">0</div>
            <div class="stat-sub">→ ~60.8% expected</div>
          </div>

          <div class="legend">
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_COPRIME}"></div>
              Coprime (GCD = 1)
            </div>
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_NOT_COPRIME}"></div>
              Not coprime (GCD > 1)
            </div>
          </div>

          <div class="explanation">
            <h3>How it works</h3>
            <div class="formula">P(coprime) = 6/π² ≈ 0.6079</div>
            <p>
              Two random positive integers are coprime (share no common
              factors other than 1) with probability 6/π².
            </p>
            <p>
              By generating many random pairs and counting coprimes,
              we can estimate π: π ≈ √(6 / P(coprime)).
            </p>
            <p>
              The grid visualizes pairs by their values modulo 50,
              coloring each by whether they're coprime.
            </p>
          </div>
        </div>
      </div>
    `

    canvas = queryRequired(page, '#co-canvas', HTMLCanvasElement)
    btnStart = queryRequired(page, '#co-start', HTMLButtonElement)
    btnStep = queryRequired(page, '#co-step', HTMLButtonElement)
    btnReset = queryRequired(page, '#co-reset', HTMLButtonElement)
    elEstimate = queryRequired(page, '#co-estimate')
    elPairs = queryRequired(page, '#co-pairs')
    elCoprimeCount = queryRequired(page, '#co-coprime-count')
    elError = queryRequired(page, '#co-error')

    ctx = getCanvasContext2D(canvas)
    draw()
    updateStats()

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

    return page
  }

  function cleanup(): void {
    state.running = false
    if (state.rafId !== null) cancelAnimationFrame(state.rafId)
  }

  return { render, cleanup }
}
