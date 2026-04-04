import { fmt } from '../utils'
import { C_BG, C_INSIDE, C_AMBER, C_TEXT_MUTED, C_OUTSIDE, PREVIEW_SIZE } from '../colors'
import { clearCanvas } from './base/canvas'
import { createMethodPageFactory, statCard, explanation } from './base/page'

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
export function drawPreview(ctx: CanvasRenderingContext2D, time: number): void {
  const s = PREVIEW_SIZE
  clearCanvas(ctx, s, s)

  // Generate all valid coin toss sequences up to 8 coins
  // A valid sequence ends when heads > tails, and at no point before did heads > tails
  const possibleCoinSequences: boolean[][] = []
  const maxTosses = 8

  function generateSequences(seq: boolean[], heads: number, tails: number): void {
    // If heads > tails, we have a winning sequence
    if (heads > tails && seq.length > 0) {
      possibleCoinSequences.push([...seq])
      return
    }
    // Stop if we've reached max length
    if (seq.length >= maxTosses) return

    // Add a tail (false) - we can always add tails when heads <= tails
    seq.push(false)
    generateSequences(seq, heads, tails + 1)
    seq.pop()

    // Add a head (true) - only if adding it wouldn't make us stop earlier
    seq.push(true)
    generateSequences(seq, heads + 1, tails)
    seq.pop()
  }

  generateSequences([], 0, 0)

  const coinSequences = 6
  // Animation timing
  const coinsPerSecond = 2
  const pauseDuration = 0.1

  // Calculate cycle duration based on worst case
  const maxTotalCoins = coinSequences * possibleCoinSequences.reduce((max, seq) => Math.max(max, seq.length), 0)
  const cycleDuration = (maxTotalCoins / coinsPerSecond) + pauseDuration

  // Use time to determine cycle - each cycle gets different random sequences
  const cycleIndex = Math.floor(time / cycleDuration)
  const cycleTime = time % cycleDuration

  // Seeded random for consistent picks per cycle
  const seed = (cycleIndex * 7919 + 104729) % 1000000
  const seededRandom = (idx: number) => Math.abs(Math.sin(seed * (idx + 1) * 0.001) * 10000) % 1

  // Pick coinSequences sequences randomly from the predefined list
  const sequences: boolean[][] = []
  for (let i = 0; i < coinSequences; i++) {
    const pickIndex = Math.floor(seededRandom(i) * possibleCoinSequences.length)
    sequences.push(possibleCoinSequences[pickIndex])
  }

  const totalCoins = sequences.reduce((sum, seq) => sum + seq.length, 0)
  const animationDuration = totalCoins / coinsPerSecond

  // During pause, show all coins; then restart
  let visibleCoins: number
  if (cycleTime < animationDuration) {
    // Animating - show coins one by one
    visibleCoins = Math.floor(cycleTime * coinsPerSecond)
  } else {
    // Pause or between cycles - keep showing all coins
    visibleCoins = totalCoins
  }
  visibleCoins = Math.min(visibleCoins, totalCoins)

  const coinRadius = 7
  const coinSpacing = 16
  const rowHeight = 22
  const startY = 14

  let coinIndex = 0
  for (let row = 0; row < sequences.length; row++) {
    const seq = sequences[row]
    const y = startY + row * rowHeight

    for (let col = 0; col < seq.length; col++) {
      if (coinIndex >= visibleCoins) break

      const x = 12 + col * coinSpacing
      const isHead = seq[col]
      ctx.fillStyle = isHead ? C_INSIDE : C_OUTSIDE
      ctx.beginPath()
      ctx.arc(x, y, coinRadius, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = C_BG
      ctx.font = 'bold 8px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(isHead ? 'H' : 'T', x, y + 3)

      coinIndex++
    }
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
export const createCoinTossPage = createMethodPageFactory<State>(
  {
    title: 'Coin Toss Sequences',
    subtitle: 'Toss coins until heads exceed tails — the ratio reveals π/4.',
    index: '04',
    canvasWidth: CANVAS_W,
    canvasHeight: CANVAS_H,
    controls: `
      <button id="ct-start" class="btn primary">Start</button>
      <button id="ct-step" class="btn">Show</button>
      <button id="ct-reset" class="btn" disabled>Reset</button>
    `,
    statsPanel: `
      ${statCard('π estimate', 'ct-estimate', { valueClass: 'stat-value large', errorId: 'ct-error', progressId: 'ct-bar' })}
      ${statCard('Sequences completed', 'ct-sequences', { subtext: `of ${MAX_SEQUENCES.toLocaleString()} max` })}
      ${statCard('Average heads/total ratio', 'ct-avg-ratio')}
      ${explanation('The Coin Toss Method', [
        'For each sequence: toss a coin repeatedly until the number of heads exceeds the number of tails. Record the ratio of heads to total tosses.',
        'Surprisingly, this ratio converges to π/4. The expected number of tosses until heads exceed tails is π²/8, but the ratio of heads to total flips approaches π/4.',
        'Press <em>Start</em> to watch sequences build step-by-step, or use <em>Show</em> to add individual sequences instantly.'
      ], 'π/4 ≈ average(heads/total)')}
    `
  },
  {
    sequences: [],
    sumRatios: 0,
    sequenceBatch: [],
    currentSequence: null,
    autoAdding: false,
    autoRafId: null,
    newCoinIndex: null,
    highlightTimeout: null,
    highlightComplete: false
  },
  {
    init(ctx) {
      const canvasCtx = ctx.ctx
      const $required = ctx.$required.bind(ctx)

      const btnStart = $required('#ct-start') as HTMLButtonElement
      const btnStep = $required('#ct-step') as HTMLButtonElement
      const btnReset = $required('#ct-reset') as HTMLButtonElement
      const elEstimate = $required('#ct-estimate')
      const elSequences = $required('#ct-sequences')
      const elAvgRatio = $required('#ct-avg-ratio')
      const elError = $required('#ct-error')
      const elBar = $required('#ct-bar')

      const STEP_FRAME_DELAY = 80

      // ── Draw ─────────────────────────────────────────────────────────────────
      function draw(): void {
        canvasCtx.fillStyle = C_BG
        canvasCtx.fillRect(0, 0, CANVAS_W, CANVAS_H)

        drawGraph()
        drawSequenceGrid()
      }

      function drawGraph(): void {
        const n = ctx.state.sequences.length
        if (n === 0) return

        // Draw target line and text first
        const targetScale = Math.max(0, Math.min(1, (Math.PI / 4 - 0.6) / 0.3))
        const targetY = CANVAS_H - (targetScale * CANVAS_H)
        canvasCtx.strokeStyle = C_TARGET
        canvasCtx.lineWidth = 2
        canvasCtx.setLineDash([5, 5])
        canvasCtx.beginPath()
        canvasCtx.moveTo(0, targetY)
        canvasCtx.lineTo(CANVAS_W, targetY)
        canvasCtx.stroke()
        canvasCtx.setLineDash([])

        canvasCtx.fillStyle = C_TEXT
        canvasCtx.font = '12px monospace'
        canvasCtx.fillText(`π/4 ${(Math.PI/4).toFixed(2)}`, CANVAS_W - 70, targetY - 5)

        // Then draw running estimate graph
        canvasCtx.strokeStyle = C_RATIO
        canvasCtx.lineWidth = 2
        canvasCtx.beginPath()
        let cumulativeSum = 0
        for (let i = 0; i < n; i++) {
          cumulativeSum += ctx.state.sequences[i].ratio
          const avg = cumulativeSum / (i + 1)
          const x = (i / Math.max(n - 1, 1)) * CANVAS_W
          const scale = Math.max(0, Math.min(1, (avg - 0.6) / 0.3))
          const y = CANVAS_H - (scale * CANVAS_H)
          if (i === 0) canvasCtx.moveTo(x, y)
          else canvasCtx.lineTo(x, y)
        }
        canvasCtx.stroke()

        const lastX = ((n - 1) / Math.max(n - 1, 1)) * CANVAS_W
        const lastScale = Math.max(0, Math.min(1, ((cumulativeSum / n) - 0.6) / 0.3))
        const lastY = CANVAS_H - (lastScale * CANVAS_H)
        canvasCtx.fillStyle = C_RATIO
        canvasCtx.beginPath()
        canvasCtx.arc(lastX, lastY, 4, 0, Math.PI * 2)
        canvasCtx.fill()
      }

      function drawSequenceGrid(): void {
        const combined: Sequence[] = [...ctx.state.sequenceBatch]
        if (ctx.state.currentSequence) combined.push(ctx.state.currentSequence)
        if (combined.length === 0) return

        const rows = Math.min(combined.length, MAX_GRID_ROWS)
        const visible = combined.slice(-rows)
        const rowHeight = CANVAS_H / MAX_GRID_ROWS

        for (let r = 0; r < visible.length; r++) {
          const seq = visible[r]
          const displayRow = r
          const rowY = displayRow * rowHeight + rowHeight / 2
          const tosses = seq.tosses
          const finished = seq !== ctx.state.currentSequence

          for (let j = 0; j < Math.min(tosses.length, MAX_GRID_COLS); j++) {
            const x = (j * (CANVAS_W / MAX_GRID_COLS)) + 15
            const isHead = tosses[j]
            const isNew = !finished && j === ctx.state.newCoinIndex
            canvasCtx.fillStyle = isHead ? C_RATIO : '#888'
            canvasCtx.globalAlpha = finished ? 1 : 0.8
            canvasCtx.beginPath()
            canvasCtx.arc(x, rowY, 10, 0, Math.PI * 2)
            canvasCtx.fill()

            if (isNew) {
              canvasCtx.strokeStyle = 'white'
              canvasCtx.lineWidth = 2
              canvasCtx.stroke()
            }

            canvasCtx.fillStyle = 'white'
            canvasCtx.font = '12px monospace'
            canvasCtx.textAlign = 'center'
            canvasCtx.fillText(isHead ? 'H' : 'T', x, rowY + 5)
          }

          canvasCtx.globalAlpha = 1
          if (!finished) {
            canvasCtx.strokeStyle = 'rgba(255,255,255,0.8)'
            canvasCtx.lineWidth = 2
            canvasCtx.strokeRect(5, rowY - rowHeight / 2 + 4, CANVAS_W - 10, rowHeight - 8)
          }

          canvasCtx.fillStyle = '#ffffff'
          canvasCtx.font = '10px monospace'
          canvasCtx.textAlign = 'left'
          canvasCtx.fillText(`${seq.heads}/${seq.total} = ${seq.ratio.toFixed(2)}`, 10, rowY - rowHeight / 4)
        }
      }

      function stopAutoAdd(): void {
        ctx.state.autoAdding = false
        if (ctx.state.autoRafId !== null) {
          clearTimeout(ctx.state.autoRafId)
          ctx.state.autoRafId = null
        }
        if (ctx.state.highlightTimeout !== null) {
          clearTimeout(ctx.state.highlightTimeout)
          ctx.state.highlightTimeout = null
        }
        ctx.state.newCoinIndex = null
        btnStep.disabled = false
        btnStep.textContent = 'Show'
        btnStart.disabled = false
        btnStart.textContent = 'Start'
      }

      function animateStep(): void {
        if (!ctx.state.autoAdding) {
          btnStep.disabled = false
          btnStart.disabled = false
          btnStart.textContent = 'Start'
          btnStep.textContent = 'Show'
          return
        }

        if (ctx.state.sequences.length >= MAX_SEQUENCES) {
          stopAutoAdd()
          btnStart.textContent = 'Done'
          btnStart.disabled = true
          return
        }

        if (!ctx.state.currentSequence) {
          ctx.state.currentSequence = createEmptySequence()
        }

        const complete = advanceSequence(ctx.state.currentSequence, MAX_GRID_COLS)
        draw()

        if (complete) {
          const completed = ctx.state.currentSequence
          if (completed) {
            ctx.state.sequences.push(completed)
            ctx.state.sumRatios += completed.ratio
            ctx.state.sequenceBatch.push(completed)
            if (ctx.state.sequenceBatch.length > MAX_GRID_ROWS) {
              ctx.state.sequenceBatch.shift()
            }
          }
          ctx.state.currentSequence = null
          updateStats()
        }

        ctx.state.autoRafId = setTimeout(() => {
          requestAnimationFrame(animateStep)
        }, STEP_FRAME_DELAY)
      }

      function updateStats(): void {
        const n = ctx.state.sequences.length
        const pi = estimatePi(ctx.state.sumRatios, n)
        const avgRatio = n > 0 ? ctx.state.sumRatios / n : 0

        elEstimate.textContent = fmt(pi)
        elSequences.textContent = n.toLocaleString()
        elAvgRatio.textContent = fmt(avgRatio)
        elError.textContent = Math.abs(pi - Math.PI).toFixed(6)
        elBar.style.width = `${Math.min((n / MAX_SEQUENCES) * 100, 100)}%`

        draw()
      }

      function startShowing(): void {
        if (ctx.state.autoAdding) return
        ctx.state.autoAdding = true
        btnStart.textContent = 'Pause'
        btnStep.disabled = true
        btnReset.disabled = false
        if (!ctx.state.currentSequence) {
          ctx.state.currentSequence = createEmptySequence()
        }
        animateStep()
      }

      function reset(): void {
        stopAutoAdd()
        ctx.state.sequences = []
        ctx.state.sumRatios = 0
        ctx.state.sequenceBatch = []
        ctx.state.currentSequence = null
        ctx.state.autoAdding = false
        ctx.state.autoRafId = null
        ctx.state.newCoinIndex = null
        ctx.state.highlightTimeout = null
        draw()
        updateStats()
        btnStart.textContent = 'Start'
        btnStart.disabled = false
        btnStep.disabled = false
        btnStep.textContent = 'Show'
        btnReset.disabled = true
      }

      // Initial draw
      draw()

      // Event handlers
      btnStart.addEventListener('click', () => {
        if (ctx.state.autoAdding) {
          stopAutoAdd()
          return
        }

        if (ctx.state.sequences.length >= MAX_SEQUENCES) {
          reset()
          return
        }

        startShowing()
      })

      btnStep.addEventListener('click', () => {
        if (ctx.state.autoAdding) return

        if (ctx.state.sequences.length >= MAX_SEQUENCES) {
          reset()
          return
        }

        // If there's a pending highlight, finalize it immediately
        if (ctx.state.highlightTimeout) {
          clearTimeout(ctx.state.highlightTimeout)
          ctx.state.highlightTimeout = null
          if (ctx.state.highlightComplete && ctx.state.currentSequence) {
            ctx.state.sequenceBatch.push(ctx.state.currentSequence)
            if (ctx.state.sequenceBatch.length > MAX_GRID_ROWS) {
              ctx.state.sequenceBatch.shift()
            }
            ctx.state.currentSequence = null
          }
          ctx.state.newCoinIndex = null
          ctx.state.highlightComplete = false
          draw()
        }

        if (!ctx.state.currentSequence) {
          ctx.state.currentSequence = createEmptySequence()
        }

        const prevLength = ctx.state.currentSequence.tosses.length
        const complete = advanceSequence(ctx.state.currentSequence, MAX_GRID_COLS)
        if (ctx.state.currentSequence.tosses.length > prevLength) {
          ctx.state.newCoinIndex = ctx.state.currentSequence.tosses.length - 1
        }
        draw()

        if (complete) {
          const completed = ctx.state.currentSequence
          ctx.state.sequences.push(completed)
          ctx.state.sumRatios += completed.ratio
          updateStats()
          ctx.state.highlightComplete = true
          // Keep currentSequence for highlight, add to batch after delay
          ctx.state.highlightTimeout = setTimeout(() => {
            ctx.state.highlightTimeout = null
            ctx.state.highlightComplete = false
            ctx.state.newCoinIndex = null
            ctx.state.sequenceBatch.push(completed)
            if (ctx.state.sequenceBatch.length > MAX_GRID_ROWS) {
              ctx.state.sequenceBatch.shift()
            }
            ctx.state.currentSequence = null
            draw()
          }, 300)
        } else {
          ctx.state.highlightComplete = false
          // Clear highlight after a brief delay
          ctx.state.highlightTimeout = setTimeout(() => {
            ctx.state.highlightTimeout = null
            ctx.state.newCoinIndex = null
            draw()
          }, 300)
        }

        btnReset.disabled = false
      })

      btnReset.addEventListener('click', reset)
    },

    cleanup(ctx) {
      // Stop any running animations
      ctx.state.autoAdding = false
      if (ctx.state.autoRafId !== null) {
        clearTimeout(ctx.state.autoRafId)
        ctx.state.autoRafId = null
      }
      if (ctx.state.highlightTimeout !== null) {
        clearTimeout(ctx.state.highlightTimeout)
        ctx.state.highlightTimeout = null
      }
    }
  }
)
