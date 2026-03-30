import type { Page } from '../router'
import { fmt, queryRequired } from '../utils'
import { C_BG, C_INSIDE, C_AMBER, C_TEXT_MUTED, CANVAS_SIZE, PREVIEW_SIZE } from '../colors'

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_TERMS = 50

// ─── Preview Renderer ────────────────────────────────────────────────────────
export function drawPreview(ctx: CanvasRenderingContext2D, time: number): void {
  const s = PREVIEW_SIZE
  ctx.fillStyle = C_BG
  ctx.fillRect(0, 0, s, s)

  const cycleDuration = 6 // seconds for full animation
  const timeInCycle = time % cycleDuration
  const progress = timeInCycle / cycleDuration

  // Number of terms to show (1 to 8)
  const maxTerms = 8
  const termsShown = Math.min(maxTerms, Math.floor(progress * maxTerms) + 1)
  const termProgress = (progress * maxTerms) % 1

  // Calculate scale so all squares fit
  const maxSquareSize = s * 0.5
  const scaleFactor = maxSquareSize / Math.sqrt(1) // 1/1² = 1

  // Animate squares appearing
  let totalHeight = 0
  for (let n = 1; n <= termsShown; n++) {
    const term = 1 / (n * n)
    const size = Math.sqrt(term) * scaleFactor
    totalHeight += size
  }

  // Center vertically
  let y = (s - totalHeight) / 2

  // Draw each square with animation
  for (let n = 1; n <= termsShown; n++) {
    const term = 1 / (n * n)
    const size = Math.sqrt(term) * scaleFactor
    const x = (s - size) / 2

    // Fade in animation for newly added square
    const isNew = n === termsShown
    const alpha = isNew ? Math.min(1, termProgress * 3) : 0.9 - n * 0.05

    // Color gradient: blue to cyan
    const hue = 200 + (n - 1) * 8
    ctx.fillStyle = `hsla(${hue}, 70%, 55%, ${alpha})`

    // Draw the square
    if (isNew && termProgress < 0.3) {
      // Scale in animation for new square
      const scaleIn = Math.min(1, termProgress / 0.3)
      const scaledSize = size * scaleIn
      ctx.fillRect(s / 2 - scaledSize / 2, y + (size - scaledSize), scaledSize, scaledSize)
    } else {
      ctx.fillRect(x, y, size, size)
    }

    y += size
  }

  // Draw limit indicator on the right
  const limit = Math.PI * Math.PI / 6 // ~1.6449
  const sumHeight = limit * scaleFactor * 0.95 // Approximate max height
  const limitY = s / 2 - sumHeight / 2

  ctx.strokeStyle = C_AMBER
  ctx.lineWidth = 2
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(s - 18, limitY)
  ctx.lineTo(s - 18, limitY + sumHeight)
  ctx.stroke()
  ctx.setLineDash([])

  // Formula text at top
  ctx.fillStyle = C_AMBER
  ctx.font = '10px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('Σ 1/n² → π²/6', s / 2, 14)

  // Show n=value indicator
  ctx.fillStyle = C_TEXT_MUTED
  ctx.font = '9px monospace'
  ctx.fillText(`n=${termsShown}`, s / 2, s - 6)
}

// ─── State ───────────────────────────────────────────────────────────────────
interface State {
  terms: number
  sum: number
  running: boolean
  intervalId: ReturnType<typeof setInterval> | null
}

// ─── Page Factory ─────────────────────────────────────────────────────────────
export function createBaselPage(): Page {
  const state: State = { terms: 0, sum: 0, running: false, intervalId: null }
  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D
  let btnStart: HTMLButtonElement
  let btnStep: HTMLButtonElement
  let btnReset: HTMLButtonElement
  let elEstimate: HTMLElement
  let elTerms: HTMLElement
  let elSum: HTMLElement
  let elError: HTMLElement

  // ── Draw the stacked squares ───────────────────────────────────────────────
  function draw(): void {
    const W = canvas.width
    const H = canvas.height

    ctx.fillStyle = C_BG
    ctx.fillRect(0, 0, W, H)

    // Constants for visualization
    const limit = Math.PI * Math.PI / 6
    const padding = 60
    const maxSquareSize = Math.min(W, H) * 0.45

    // Scale factor: the first square (1/1² = 1) takes maxSquareSize
    const scaleFactor = maxSquareSize

    // Calculate total height of all squares shown
    let totalHeight = 0
    for (let n = 1; n <= state.terms; n++) {
      const term = 1 / (n * n)
      const size = Math.sqrt(term) * scaleFactor
      totalHeight += size
    }

    // Center the stack vertically
    const baseY = H - padding
    let y = baseY

    // Draw π²/6 limit indicator on the right
    const limitHeight = limit * scaleFactor * 0.6 // Approximate visual height
    const limitY = baseY - limitHeight

    ctx.strokeStyle = C_AMBER
    ctx.lineWidth = 2
    ctx.setLineDash([8, 6])
    ctx.beginPath()
    ctx.moveTo(W - padding + 10, baseY)
    ctx.lineTo(W - padding + 10, limitY)
    ctx.stroke()
    ctx.setLineDash([])

    // Limit label
    ctx.fillStyle = C_AMBER
    ctx.font = '12px "JetBrains Mono", monospace'
    ctx.textAlign = 'right'
    ctx.fillText('π²/6', W - padding + 30, limitY + 4)
    ctx.font = '10px "JetBrains Mono", monospace'
    ctx.fillText('≈ 1.645', W - padding + 30, limitY + 18)

    // Draw stacked squares (from bottom to top)
    for (let n = state.terms; n >= 1; n--) {
      const term = 1 / (n * n)
      const size = Math.sqrt(term) * scaleFactor
      const x = (W - size) / 2

      // Fade effect: older terms slightly faded
      const alpha = 0.95 - (n - 1) * 0.015

      // Color gradient: blue to cyan based on term number
      const hue = 200 + (n - 1) * 5
      ctx.fillStyle = `hsla(${hue}, 70%, 55%, ${alpha})`
      ctx.fillRect(x, y - size, size, size)

      // Subtle border
      ctx.strokeStyle = `hsla(${hue}, 60%, 45%, ${alpha * 0.5})`
      ctx.lineWidth = 1
      ctx.strokeRect(x, y - size, size, size)

      y -= size
    }

    // Draw baseline
    ctx.strokeStyle = C_TEXT_MUTED
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(padding, baseY)
    ctx.lineTo(W - padding, baseY)
    ctx.stroke()

    // Current sum indicator on the left
    if (state.terms > 0) {
      const sumHeight = state.sum * scaleFactor * 0.6
      ctx.fillStyle = C_INSIDE
      ctx.globalAlpha = 0.6
      ctx.fillRect(padding - 25, baseY - sumHeight, 15, sumHeight)
      ctx.globalAlpha = 1

      ctx.strokeStyle = C_INSIDE
      ctx.lineWidth = 2
      ctx.strokeRect(padding - 25, baseY - sumHeight, 15, sumHeight)

      // Sum label
      ctx.fillStyle = C_TEXT_MUTED
      ctx.font = '10px "JetBrains Mono", monospace'
      ctx.textAlign = 'center'
      ctx.fillText('Σ', padding - 17, baseY + 15)
    }

    // Term count label
    ctx.fillStyle = C_TEXT_MUTED
    ctx.font = '11px "JetBrains Mono", monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`n = 1 to ${state.terms}`, W / 2, baseY + 25)

    // Formula at top
    ctx.fillStyle = C_AMBER
    ctx.font = '14px "JetBrains Mono", monospace'
    ctx.fillText('∑ 1/n² = π²/6', W / 2, 30)
  }

  // ── Update stats display ────────────────────────────────────────────────────
  function updateStats(): void {
    const piEstimate = Math.sqrt(6 * state.sum)
    const error = Math.abs(piEstimate - Math.PI)

    elEstimate.textContent = fmt(piEstimate)
    elTerms.textContent = state.terms.toLocaleString()
    elSum.textContent = fmt(state.sum)
    elError.textContent = `Error: ${fmt(error)}`
    elError.className = 'stat-error ' + (error < 0.1 ? 'improving' : 'neutral')
  }

  function addTerm(): void {
    state.terms++
    state.sum += 1 / (state.terms * state.terms)
    draw()
    updateStats()
    if (state.terms >= MAX_TERMS) {
      stop()
    }
  }

  function start(): void {
    state.running = true
    btnStart.disabled = true
    btnReset.disabled = false
    btnStart.textContent = 'Running…'
    state.intervalId = setInterval(addTerm, 150)
  }

  function stop(): void {
    state.running = false
    if (state.intervalId !== null) {
      clearInterval(state.intervalId)
      state.intervalId = null
    }
    btnStart.disabled = state.terms >= MAX_TERMS
    btnStart.textContent = state.terms >= MAX_TERMS ? 'Done' : 'Start'
  }

  function reset(): void {
    stop()
    state.terms = 0
    state.sum = 0
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
        <span class="page-index">Method 09</span>
        <h2 class="page-title">Basel Problem</h2>
        <p class="page-subtitle">
          The sum of reciprocal squares converges to π²/6.
        </p>
      </header>

      <div class="viz-layout">
        <div>
          <div class="canvas-wrapper">
            <canvas id="ba-canvas" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"></canvas>
          </div>
          <div style="margin-top:14px" class="controls">
            <button id="ba-start" class="btn primary">Start</button>
            <button id="ba-step" class="btn">Add Term</button>
            <button id="ba-reset" class="btn" disabled>Reset</button>
          </div>
        </div>

        <div class="stats-panel">
          <div class="stat-card">
            <div class="stat-label">π estimate √(6×sum)</div>
            <div class="stat-value large" id="ba-estimate">—</div>
            <div class="stat-error neutral" id="ba-error">Error: —</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Current sum ∑1/n²</div>
            <div class="stat-value" id="ba-sum">0</div>
            <div class="stat-sub">→ π²/6 ≈ 1.6449</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Terms added</div>
            <div class="stat-value" id="ba-terms">0</div>
            <div class="stat-sub">of ${MAX_TERMS} max</div>
          </div>

          <div class="legend">
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_INSIDE}"></div>
              Cumulative sum
            </div>
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_AMBER}"></div>
              Limit π²/6
            </div>
          </div>

          <div class="explanation">
            <h3>How it works</h3>
            <div class="formula">∑₁^∞ 1/n² = π²/6</div>
            <p>
              Euler proved in 1734 that the sum of reciprocal squares
              equals π²/6. This was a famous open problem known as
              the Basel Problem.
            </p>
            <p>
              Each term 1/n² is visualized as a rectangle. The total
              height of all rectangles approaches π²/6 ≈ 1.6449.
              Therefore π ≈ √(6 × sum).
            </p>
          </div>
        </div>
      </div>
    `

    canvas = queryRequired(page, '#ba-canvas', HTMLCanvasElement)
    btnStart = queryRequired(page, '#ba-start', HTMLButtonElement)
    btnStep = queryRequired(page, '#ba-step', HTMLButtonElement)
    btnReset = queryRequired(page, '#ba-reset', HTMLButtonElement)
    elEstimate = queryRequired(page, '#ba-estimate')
    elTerms = queryRequired(page, '#ba-terms')
    elSum = queryRequired(page, '#ba-sum')
    elError = queryRequired(page, '#ba-error')

    ctx = canvas.getContext('2d')!
    draw()
    updateStats()

    btnStart.addEventListener('click', () => {
      if (!state.running) start()
    })
    btnStep.addEventListener('click', () => {
      if (!state.running) {
        addTerm()
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
