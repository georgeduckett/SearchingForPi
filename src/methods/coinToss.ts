import type { Page } from '../router'
import { fmt, queryRequired } from '../utils'
import { C_BG, C_INSIDE, C_AMBER, C_TEXT_MUTED, C_OUTSIDE, PREVIEW_SIZE } from '../colors'

// ─── Constants ───────────────────────────────────────────────────────────────
const CANVAS_W = 560
const CANVAS_H = 320
const MAX_SEQUENCES = 10_000
const MAX_GRID_COLS = 20
const MAX_GRID_ROWS = 10

// ─── Colours (using shared with method-specific) ─────────────────────────────
const C_RATIO = C_INSIDE
const C_TARGET = C_AMBER
const C_TEXT = C_TEXT_MUTED

// ─── Preview Renderer ────────────────────────────────────────────────────────
export function drawPreview(ctx: CanvasRenderingContext2D, _time: number): void {
  const s = PREVIEW_SIZE
  ctx.fillStyle = C_BG
  ctx.fillRect(0, 0, s, s)

  for (let i = 0; i < 8; i++) {
    const x = 15 + (i % 4) * 30
    const y = 25 + Math.floor(i / 4) * 50
    const heads = Math.sin(i * 5.7) > 0
    ctx.fillStyle = heads ? C_INSIDE : C_OUTSIDE
    ctx.beginPath()
    ctx.arc(x, y, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = C_BG
    ctx.font = 'bold 10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(heads ? 'H' : 'T', x, y + 4)
  }
}

// ─── State ───────────────────────────────────────────────────────────────────
interface Sequence {
  tosses: boolean[]
  heads: number
  total: number
  ratio: number
}

interface State {
  sequences: Sequence[]
  sumRatios: number
  sequenceBatch: Sequence[]
  currentSequence: Sequence | null
  autoAdding: boolean
  autoRafId: ReturnType<typeof setTimeout> | null
  newCoinIndex: number | null
  highlightTimeout: ReturnType<typeof setTimeout> | null
  highlightComplete: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function createEmptySequence(): Sequence {
  return { tosses: [], heads: 0, total: 0, ratio: 0 }
}

function advanceSequence(seq: Sequence, maxTosses = MAX_GRID_COLS): boolean {
  const isWin = seq.heads > seq.total - seq.heads && seq.total > 0
  if (isWin) {
    seq.ratio = seq.heads / seq.total
    return true
  }

  if (seq.total >= maxTosses) {
    while (!(seq.heads > seq.total - seq.heads)) {
      const isHead = Math.random() < 0.5
      seq.tosses.push(isHead)
      seq.total++
      if (isHead) seq.heads++
    }
    seq.ratio = seq.heads / seq.total
    return true
  }

  const isHead = Math.random() < 0.5
  seq.tosses.push(isHead)
  seq.total++
  if (isHead) seq.heads++

  const tails = seq.total - seq.heads

  if (seq.heads > tails) {
    seq.ratio = seq.heads / seq.total
    return true
  }

  if (seq.total >= maxTosses) {
    while (!(seq.heads > seq.total - seq.heads)) {
      const queuedHead = Math.random() < 0.5
      seq.tosses.push(queuedHead)
      seq.total++
      if (queuedHead) seq.heads++
    }
    seq.ratio = seq.heads / seq.total
    return true
  }

  seq.ratio = seq.heads / seq.total
  return false
}

function estimatePi(sumRatios: number, numSequences: number): number {
  if (numSequences === 0) return 0
  const avgRatio = sumRatios / numSequences
  return 4 * avgRatio
}

// ─── Page Factory ─────────────────────────────────────────────────────────────
export function createCoinTossPage(): Page {
  const state: State = {
    sequences: [],
    sumRatios: 0,
    sequenceBatch: [],
    currentSequence: null,
    autoAdding: false,
    autoRafId: null,
    newCoinIndex: null,
    highlightTimeout: null,
    highlightComplete: false
  }

  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D
  let btnStart: HTMLButtonElement
  let btnStep: HTMLButtonElement
  let btnReset: HTMLButtonElement
  let elEstimate: HTMLElement
  let elSequences: HTMLElement
  let elAvgRatio: HTMLElement
  let elError: HTMLElement
  let elBar: HTMLElement

  // ── Draw ───────────────────────────────────────────────────────────────────
  function draw(): void {
    ctx.fillStyle = C_BG
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    drawGraph()
    drawSequenceGrid()
  }

  function drawGraph(): void {
    const n = state.sequences.length
    if (n === 0) return

    // Draw target line and text first
    const targetScale = Math.max(0, Math.min(1, (Math.PI / 4 - 0.6) / 0.3))
    const targetY = CANVAS_H - (targetScale * CANVAS_H)
    ctx.strokeStyle = C_TARGET
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(0, targetY)
    ctx.lineTo(CANVAS_W, targetY)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = C_TEXT
    ctx.font = '12px monospace'
    ctx.fillText(`π/4 ${(Math.PI/4).toFixed(2)}`, CANVAS_W - 70, targetY - 5)

    // Then draw running estimate graph
    ctx.strokeStyle = C_RATIO
    ctx.lineWidth = 2
    ctx.beginPath()
    let cumulativeSum = 0
    for (let i = 0; i < n; i++) {
      cumulativeSum += state.sequences[i].ratio
      const avg = cumulativeSum / (i + 1)
      const x = (i / Math.max(n - 1, 1)) * CANVAS_W
      const scale = Math.max(0, Math.min(1, (avg - 0.6) / 0.3))
      const y = CANVAS_H - (scale * CANVAS_H)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    const lastX = ((n - 1) / Math.max(n - 1, 1)) * CANVAS_W
    const lastScale = Math.max(0, Math.min(1, ((cumulativeSum / n) - 0.6) / 0.3))
    const lastY = CANVAS_H - (lastScale * CANVAS_H)
    ctx.fillStyle = C_RATIO
    ctx.beginPath()
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2)
    ctx.fill()
  }

  function drawSequenceGrid(): void {
    const combined: Sequence[] = [...state.sequenceBatch]
    if (state.currentSequence) combined.push(state.currentSequence)
    if (combined.length === 0) return

    const rows = Math.min(combined.length, MAX_GRID_ROWS)
    const visible = combined.slice(-rows)
    const rowHeight = CANVAS_H / MAX_GRID_ROWS

    for (let r = 0; r < visible.length; r++) {
      const seq = visible[r]
      const displayRow = r
      const rowY = displayRow * rowHeight + rowHeight / 2
      const tosses = seq.tosses
      const finished = seq !== state.currentSequence

      for (let j = 0; j < Math.min(tosses.length, MAX_GRID_COLS); j++) {
        const x = (j * (CANVAS_W / MAX_GRID_COLS)) + 15
        const isHead = tosses[j]
        const isNew = !finished && j === state.newCoinIndex
        ctx.fillStyle = isHead ? C_RATIO : '#888'
        ctx.globalAlpha = finished ? 1 : 0.8
        ctx.beginPath()
        ctx.arc(x, rowY, 10, 0, Math.PI * 2)
        ctx.fill()

        if (isNew) {
          ctx.strokeStyle = 'white'
          ctx.lineWidth = 2
          ctx.stroke()
        }

        ctx.fillStyle = 'white'
        ctx.font = '12px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(isHead ? 'H' : 'T', x, rowY + 5)
      }

      ctx.globalAlpha = 1
      if (!finished) {
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'
        ctx.lineWidth = 2
        ctx.strokeRect(5, rowY - rowHeight / 2 + 4, CANVAS_W - 10, rowHeight - 8)
      }

      ctx.fillStyle = '#ffffff'
      ctx.font = '10px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`${seq.heads}/${seq.total} = ${seq.ratio.toFixed(2)}`, 10, rowY - rowHeight / 4)
    }
  }

  const STEP_FRAME_DELAY = 80

  function stopAutoAdd(): void {
    state.autoAdding = false
    if (state.autoRafId !== null) {
      clearTimeout(state.autoRafId)
      state.autoRafId = null
    }
    if (state.highlightTimeout !== null) {
      clearTimeout(state.highlightTimeout)
      state.highlightTimeout = null
    }
    state.newCoinIndex = null
    btnStep.disabled = false
    btnStep.textContent = 'Show'
    btnStart.disabled = false
    btnStart.textContent = 'Start'
  }

  function animateStep(): void {
    if (!state.autoAdding) {
      btnStep.disabled = false
      btnStart.disabled = false
      btnStart.textContent = 'Start'
      btnStep.textContent = 'Show'
      return
    }

    if (state.sequences.length >= MAX_SEQUENCES) {
      stopAutoAdd()
      btnStart.textContent = 'Done'
      btnStart.disabled = true
      return
    }

    if (!state.currentSequence) {
      state.currentSequence = createEmptySequence()
    }

    const complete = advanceSequence(state.currentSequence, MAX_GRID_COLS)
    draw()

    if (complete) {
      const completed = state.currentSequence
      if (completed) {
        state.sequences.push(completed)
        state.sumRatios += completed.ratio
        state.sequenceBatch.push(completed)
        if (state.sequenceBatch.length > MAX_GRID_ROWS) {
          state.sequenceBatch.shift()
        }
      }
      state.currentSequence = null
      updateStats()
    }

    state.autoRafId = setTimeout(() => {
      requestAnimationFrame(animateStep)
    }, STEP_FRAME_DELAY)
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  function updateStats(): void {
    const n = state.sequences.length
    const pi = estimatePi(state.sumRatios, n)
    const avgRatio = n > 0 ? state.sumRatios / n : 0

    elEstimate.textContent = fmt(pi)
    elSequences.textContent = n.toLocaleString()
    elAvgRatio.textContent = fmt(avgRatio)
    elError.textContent = Math.abs(pi - Math.PI).toFixed(6)
    elBar.style.width = `${Math.min((n / MAX_SEQUENCES) * 100, 100)}%`

    draw()
  }

  function startShowing(): void {
    if (state.autoAdding) return
    state.autoAdding = true
    btnStart.textContent = 'Pause'
    btnStep.disabled = true
    btnReset.disabled = false
    if (!state.currentSequence) {
      state.currentSequence = createEmptySequence()
    }
    animateStep()
  }

  function reset(): void {
    stopAutoAdd()
    state.sequences = []
    state.sumRatios = 0
    state.sequenceBatch = []
    state.currentSequence = null
    state.autoAdding = false
    state.autoRafId = null
    state.newCoinIndex = null
    state.highlightTimeout = null
    draw()
    updateStats()
    btnStart.textContent = 'Start'
    btnStart.disabled = false
    btnStep.disabled = false
    btnStep.textContent = 'Show'
    btnReset.disabled = true
  }

  // ── Build DOM ─────────────────────────────────────────────────────────────
  function render(): HTMLElement {
    const page = document.createElement('div')
    page.className = 'page'

    page.innerHTML = `
      <header class="page-header">
        <span class="page-index">Method 04</span>
        <h2 class="page-title">Coin Toss Sequences</h2>
        <p class="page-subtitle">
          Toss coins until heads exceed tails — the ratio reveals π/4.
        </p>
      </header>

      <div class="viz-layout">
        <!-- Canvas -->
        <div>
          <div class="canvas-wrapper">
            <canvas id="ct-canvas" width="${CANVAS_W}" height="${CANVAS_H}"></canvas>
          </div>
          <div style="margin-top:14px" class="controls">
            <button id="ct-start" class="btn primary">Start</button>
            <button id="ct-step" class="btn">Show</button>
            <button id="ct-reset" class="btn" disabled>Reset</button>
          </div>
        </div>

        <!-- Stats -->
        <div class="stats-panel">
          <div class="stat-card">
            <div class="stat-label">π estimate</div>
            <div class="stat-value large" id="ct-estimate">0.000000</div>
            <div class="stat-error neutral" id="ct-error">—</div>
            <div class="progress-bar-wrap">
              <div class="progress-bar-fill" id="ct-bar" style="width:0%"></div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Sequences completed</div>
            <div class="stat-value" id="ct-sequences">0</div>
            <div class="stat-sub">of ${MAX_SEQUENCES.toLocaleString()} max</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Average heads/total ratio</div>
            <div class="stat-value" id="ct-avg-ratio">0.000000</div>
          </div>

          <div class="explanation">
            <h3>The Coin Toss Method</h3>
            <p>
              For each sequence: toss a coin repeatedly until the number of heads
              exceeds the number of tails. Record the ratio of heads to total tosses.
            </p>
            <div class="formula">π/4 ≈ average(heads/total)</div>
            <p>
              Surprisingly, this ratio converges to π/4. The expected number of
              tosses until heads exceed tails is π²/8, but the ratio of heads
              to total flips approaches π/4.
            </p>
            <p>
              Press <em>Start</em> to watch sequences build step-by-step,
              or use <em>Show</em> to add individual sequences instantly.
            </p>
          </div>
        </div>
      </div>
    `

    canvas = queryRequired(page, '#ct-canvas', HTMLCanvasElement)
    btnStart = queryRequired(page, '#ct-start', HTMLButtonElement)
    btnStep = queryRequired(page, '#ct-step', HTMLButtonElement)
    btnReset = queryRequired(page, '#ct-reset', HTMLButtonElement)
    elEstimate = queryRequired(page, '#ct-estimate')
    elSequences = queryRequired(page, '#ct-sequences')
    elAvgRatio = queryRequired(page, '#ct-avg-ratio')
    elError = queryRequired(page, '#ct-error')
    elBar = queryRequired(page, '#ct-bar')

    ctx = canvas.getContext('2d')!
    draw()

    btnStart.addEventListener('click', () => {
      if (state.autoAdding) {
        stopAutoAdd()
        return
      }

      if (state.sequences.length >= MAX_SEQUENCES) {
        reset()
        return
      }

      startShowing()
    })
    btnStep.addEventListener('click', () => {
      if (state.autoAdding) return

      if (state.sequences.length >= MAX_SEQUENCES) {
        reset()
        return
      }

      // If there's a pending highlight, finalize it immediately
      if (state.highlightTimeout) {
        clearTimeout(state.highlightTimeout)
        state.highlightTimeout = null
        if (state.highlightComplete && state.currentSequence) {
          state.sequenceBatch.push(state.currentSequence)
          if (state.sequenceBatch.length > MAX_GRID_ROWS) {
            state.sequenceBatch.shift()
          }
          state.currentSequence = null
        }
        state.newCoinIndex = null
        state.highlightComplete = false
        draw()
      }

      if (!state.currentSequence) {
        state.currentSequence = createEmptySequence()
      }

      const prevLength = state.currentSequence.tosses.length
      const complete = advanceSequence(state.currentSequence, MAX_GRID_COLS)
      if (state.currentSequence.tosses.length > prevLength) {
        state.newCoinIndex = state.currentSequence.tosses.length - 1
      }
      draw()

      if (complete) {
        const completed = state.currentSequence
        state.sequences.push(completed)
        state.sumRatios += completed.ratio
        updateStats()
        state.highlightComplete = true
        // Keep currentSequence for highlight, add to batch after delay
        state.highlightTimeout = setTimeout(() => {
          state.highlightTimeout = null
          state.highlightComplete = false
          state.newCoinIndex = null
          state.sequenceBatch.push(completed)
          if (state.sequenceBatch.length > MAX_GRID_ROWS) {
            state.sequenceBatch.shift()
          }
          state.currentSequence = null
          draw()
        }, 300)
      } else {
        state.highlightComplete = false
        // Clear highlight after a brief delay
        state.highlightTimeout = setTimeout(() => {
          state.highlightTimeout = null
          state.newCoinIndex = null
          draw()
        }, 300)
      }

      btnReset.disabled = false
    })
    btnReset.addEventListener('click', reset)

    return page
  }

  function cleanup(): void {
    stopAutoAdd()
  }

  return { render, cleanup }
}
