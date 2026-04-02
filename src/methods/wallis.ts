import type { Page } from '../router'
import { fmt, queryRequired, getCanvasContext2D } from '../utils'
import { C_BG, C_INSIDE, C_OUTSIDE, C_AMBER, C_TEXT_MUTED, CANVAS_SIZE, PREVIEW_SIZE } from '../colors'
import { clearCanvas, drawDashedLine, drawText } from './base/canvas'
import { getMethodIndex } from './definitions'

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_FACTORS = 200

// Method-specific colors
const C_OVER = C_INSIDE
const C_UNDER = C_OUTSIDE

// ─── Preview Renderer ────────────────────────────────────────────────────────
export function drawPreview(ctx: CanvasRenderingContext2D, time: number): void {
const s = PREVIEW_SIZE
clearCanvas(ctx, s, s)

  const terms = 6
  const barW = (s - 20) / terms
  for (let i = 0; i < terms; i++) {
    const n = i + 1
    const val = (2 * n) / (2 * n - 1) * (2 * n) / (2 * n + 1)
    const h = val * 20 + Math.sin(time * 0.6 + i * 0.5) * 5
    ctx.fillStyle = i % 2 === 0 ? C_INSIDE : C_AMBER
    ctx.globalAlpha = 0.7
    ctx.fillRect(10 + i * barW, s / 2 - h, barW - 3, h * 2)
  }
  ctx.globalAlpha = 1

  ctx.fillStyle = C_AMBER
  ctx.font = '11px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('→ π/2', s / 2, 15)
}

// ─── State ───────────────────────────────────────────────────────────────────
interface State {
  factors: number // Number of factors computed (each term-pair has 2 factors)
  product: number
  running: boolean
  intervalId: ReturnType<typeof setInterval> | null
}

// ─── Page Factory ─────────────────────────────────────────────────────────────
export function createWallisPage(): Page {
  const state: State = { factors: 0, product: 1, running: false, intervalId: null }
  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D
  let btnStart: HTMLButtonElement
  let btnStep: HTMLButtonElement
  let btnReset: HTMLButtonElement
  let elEstimate: HTMLElement
  let elFactors: HTMLElement
  let elProduct: HTMLElement
  let elError: HTMLElement

  // ── Get the n-th factor value (1-indexed) ────────────────────────────────────
  // Odd factors: (2k+2)/(2k+1) > 1, where k = (n-1)/2
  // Even factors: (2k+2)/(2k+3) < 1, where k = (n-2)/2
  function getFactor(n: number): number {
    const k = Math.floor((n - 1) / 2)
    if (n % 2 === 1) {
      // Odd factor: (2(k+1))/(2(k+1)-1) = (2k+2)/(2k+1)
      return (2 * (k + 1)) / (2 * (k + 1) - 1)
    } else {
      // Even factor: (2k+2)/(2k+3)
      return (2 * (k + 1)) / (2 * (k + 1) + 1)
    }
  }

  // ── Draw the product visualization ─────────────────────────────────────────
  function draw(): void {
    const W = canvas.width
    const H = canvas.height

    ctx.fillStyle = C_BG
    ctx.fillRect(0, 0, W, H)

    // Reference line at π/2
    const target = Math.PI / 2
    const maxVal = 4 // Scale for visualization
    const pad = 50
    const plotH = H - pad * 2
    const plotW = W - pad * 2
    const baseY = pad + plotH
    const scale = plotH / maxVal

    // Grid lines
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    for (let i = 0; i <= 8; i++) {
      const y = pad + (plotH * i) / 8
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke()
    }

    // π/2 reference line
    const piY = baseY - target * scale
    drawDashedLine(ctx, pad, piY, W - pad, piY, C_AMBER, 2, [8, 4])
  
    // Label
    drawText(ctx, 'π/2 ≈ 1.5708', W - pad - 80, piY - 5, C_TEXT_MUTED, '11px "JetBrains Mono", monospace')

    // Draw bars showing deviation at each factor step
    if (state.factors > 0) {
      const barW = Math.min(4, plotW / MAX_FACTORS)
      let currentProduct = 1

      for (let n = 1; n <= state.factors; n++) {
        currentProduct *= getFactor(n)
        const x = pad + (n / MAX_FACTORS) * plotW
        const deviation = currentProduct - target
        const isOver = currentProduct > target

        // Draw bar showing deviation from target
        const barY = piY
        const barH = Math.abs(deviation) * scale * 3 // Amplify for visibility

        ctx.fillStyle = isOver ? C_OVER : C_UNDER
        ctx.globalAlpha = 0.7
        if (isOver) {
          ctx.fillRect(x - barW / 2, barY - barH, barW, barH)
        } else {
          ctx.fillRect(x - barW / 2, barY, barW, barH)
        }
        ctx.globalAlpha = 1
      }
    }

    // Current product indicator
    if (state.factors > 0) {
      const x = pad + (state.factors / MAX_FACTORS) * plotW
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x, baseY)
      ctx.lineTo(x, baseY - state.product * scale)
      ctx.stroke()

      // Dot at current value
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(x, baseY - state.product * scale, 4, 0, Math.PI * 2)
      ctx.fill()
    }

    // Axis
    ctx.strokeStyle = C_TEXT_MUTED
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(pad, baseY)
    ctx.lineTo(W - pad, baseY)
    ctx.stroke()

    // Y-axis
    ctx.beginPath()
    ctx.moveTo(pad, pad)
    ctx.lineTo(pad, baseY)
    ctx.stroke()
  }

  // ── Update stats display ────────────────────────────────────────────────────
  function updateStats(): void {
    const piEstimate = 2 * state.product
    const error = Math.abs(piEstimate - Math.PI)

    elEstimate.textContent = fmt(piEstimate)
    elFactors.textContent = state.factors.toLocaleString()
    elProduct.textContent = fmt(state.product)
    elError.textContent = `Error: ${fmt(error)}`
    elError.className = 'stat-error ' + (error < 0.1 ? 'improving' : 'neutral')
  }

  function addFactor(): void {
    state.factors++
    state.product *= getFactor(state.factors)

    draw()
    updateStats()
    if (state.factors >= MAX_FACTORS) {
      stop()
    }
  }

  function start(): void {
    state.running = true
    btnStart.disabled = true
    btnReset.disabled = false
    btnStart.textContent = 'Running…'
    state.intervalId = setInterval(addFactor, 50)
  }

  function stop(): void {
    state.running = false
    if (state.intervalId !== null) {
      clearInterval(state.intervalId)
      state.intervalId = null
    }
    btnStart.disabled = state.factors >= MAX_FACTORS
    btnStart.textContent = state.factors >= MAX_FACTORS ? 'Done' : 'Start'
  }

  function reset(): void {
    stop()
    state.factors = 0
    state.product = 1
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
        <span class="page-index">Method ${getMethodIndex('wallis')}</span>
        <h2 class="page-title">Wallis Product</h2>
        <p class="page-subtitle">
          An infinite product that converges to π/2.
        </p>
      </header>

      <div class="viz-layout">
        <div>
          <div class="canvas-wrapper">
            <canvas id="wa-canvas" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"></canvas>
          </div>
          <div style="margin-top:14px" class="controls">
            <button id="wa-start" class="btn primary">Start</button>
            <button id="wa-step" class="btn">Add Factor</button>
            <button id="wa-reset" class="btn" disabled>Reset</button>
          </div>
        </div>

        <div class="stats-panel">
          <div class="stat-card">
            <div class="stat-label">π estimate (2×product)</div>
            <div class="stat-value large" id="wa-estimate">—</div>
            <div class="stat-error neutral" id="wa-error">Error: —</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Current product</div>
            <div class="stat-value" id="wa-product">1</div>
            <div class="stat-sub">→ π/2 ≈ 1.5708</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Factors computed</div>
            <div class="stat-value" id="wa-factors">0</div>
            <div class="stat-sub">of ${MAX_FACTORS} max</div>
          </div>

          <div class="legend">
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_OVER}"></div>
              Over π/2
            </div>
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_UNDER}"></div>
              Under π/2
            </div>
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_AMBER}"></div>
              Target π/2
            </div>
          </div>

          <div class="explanation">
            <h3>How it works</h3>
            <div class="formula">π/2 = (2/1)·(2/3)·(4/3)·(4/5)·(6/5)·(6/7)·…</div>
            <p>
              Discovered by John Wallis in 1655, this infinite product
              represents π/2 as an elegant alternating product of fractions.
            </p>
            <p>
              Each odd-numbered factor (2n/(2n-1)) is greater than 1 and
              temporarily pushes the product above π/2. Each even-numbered
              factor (2n/(2n+1)) brings it back below. This oscillation
              gradually dampens as the product converges.
            </p>
          </div>
        </div>
      </div>
    `

    canvas = queryRequired(page, '#wa-canvas', HTMLCanvasElement)
    btnStart = queryRequired(page, '#wa-start', HTMLButtonElement)
    btnStep = queryRequired(page, '#wa-step', HTMLButtonElement)
    btnReset = queryRequired(page, '#wa-reset', HTMLButtonElement)
    elEstimate = queryRequired(page, '#wa-estimate')
    elFactors = queryRequired(page, '#wa-factors')
    elProduct = queryRequired(page, '#wa-product')
    elError = queryRequired(page, '#wa-error')

    ctx = getCanvasContext2D(canvas)
    draw()
    updateStats()

    btnStart.addEventListener('click', () => {
      if (!state.running) start()
    })
    btnStep.addEventListener('click', () => {
      if (!state.running) {
        addFactor()
        btnReset.disabled = false
      }
    })
    btnReset.addEventListener('click', reset)

    return page
  }

  function cleanup(): void {
    if (state.intervalId !== null) clearInterval(state.intervalId)
    state.running = false
  }

  return { render, cleanup }
}
