import type { Page } from '../router'
import { queryRequired, getCanvasContext2D } from '../utils'
import { C_BG, C_TEXT_MUTED, C_INSIDE, C_AMBER, C_TEXT_PRIMARY, PREVIEW_SIZE } from '../colors'
import { clearCanvas } from './base/canvas'
import { getMethodIndex } from './definitions'

// ─── Constants ───────────────────────────────────────────────────────────────
// Base dimensions (used for scaling calculations)
const BASE_CANVAS_W = 810
const BASE_CANVAS_H = 240
const BASE_BOX_SIZE = 20
const BASE_BOX2_MIN_SIZE = 20
const BASE_BOX2_MAX_SIZE = 60
const BASE_WALL_X = 50
const BASE_INITIAL_X1 = BASE_WALL_X + BASE_CANVAS_W / 3
const BASE_INITIAL_X2 = (BASE_CANVAS_W / 3) * 2
const V0 = 80
const M1 = 1

// Mobile breakpoint
const MOBILE_BREAKPOINT = 700

// ─── Colours (using shared with method-specific) ─────────────────────────────
const C_WALL = C_TEXT_MUTED
const C_BOX1 = C_INSIDE
const C_BOX2 = C_AMBER
const C_TEXT = C_TEXT_PRIMARY

// ─── Preview Renderer ────────────────────────────────────────────────────────
export function drawPreview(ctx: CanvasRenderingContext2D, time: number): void {
  const s = PREVIEW_SIZE
  clearCanvas(ctx, s, s)

  // Wall
  ctx.strokeStyle = C_TEXT_MUTED
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(10, 0)
  ctx.lineTo(10, s)
  ctx.stroke()

  // Small box bouncing
  const x1 = 10 + Math.abs(Math.sin(time * 0.8)) * 40
  ctx.fillStyle = C_INSIDE
  ctx.fillRect(x1, s / 2 - 10, 20, 20)

  // Large box
  const x2 = 65 + Math.abs(Math.sin(time * 0.6)) * 30
  ctx.fillStyle = C_AMBER
  ctx.fillRect(x2, s / 2 - 10, 20, 20)
}

// ─── State ───────────────────────────────────────────────────────────────────
interface State {
  k: number
  m2: number
  // Positions stored in BASE coordinates
  smallBoxX: number
  smallBoxV: number
  largeBoxX: number
  largeBoxV: number
  collisions: number
  running: boolean
  rafId: number | null
  time: number
  scale: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function createInitialState(): State {
  return {
    k: 0,
    m2: 100 ** 0,
    smallBoxX: BASE_INITIAL_X1,
    smallBoxV: 0,
    largeBoxX: BASE_INITIAL_X2,
    largeBoxV: -V0,
    collisions: 0,
    running: false,
    rafId: null,
    time: 0,
    scale: 1,
  }
}

function resetState(state: State): void {
  state.k = 0
  state.m2 = 100 ** state.k
  state.smallBoxX = BASE_INITIAL_X1
  state.smallBoxV = 0
  state.largeBoxX = BASE_INITIAL_X2
  state.largeBoxV = -V0
  state.collisions = 0
  state.running = false
  state.rafId = null
  state.time = 0
}

function getBox2Size(m2: number): number {
  // Scale box size based on mass: use cube root for volume-like scaling
  // m2 ranges from 1 (k=0) to 100,000,000 (k=4)
  // Map to size range [BASE_BOX2_MIN_SIZE, BASE_BOX2_MAX_SIZE]
  const minMass = 1
  const maxMass = 100_000_000
  const t = (Math.log10(m2) - Math.log10(minMass)) / (Math.log10(maxMass) - Math.log10(minMass))
  return BASE_BOX2_MIN_SIZE + t * (BASE_BOX2_MAX_SIZE - BASE_BOX2_MIN_SIZE)
}

// ─── Page Factory ─────────────────────────────────────────────────────────────
export function createBouncingBoxesPage(): Page {
  const state: State = createInitialState()

  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D
  let elK: HTMLSelectElement
  let elHits: HTMLElement
  let elPiApprox: HTMLElement
  let elStartBtn: HTMLButtonElement
  let elResetBtn: HTMLButtonElement
  let audioContext: AudioContext | null = null
  let currentOsc: OscillatorNode | null = null
  let soundTimeout: ReturnType<typeof setTimeout> | null = null
  let resizeObserver: ResizeObserver | null = null

  // ── Sound ──────────────────────────────────────────────────────────────────
  function playCollisionSound(): void {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }

    if (currentOsc) {
      currentOsc.stop()
      currentOsc = null
    }
    if (soundTimeout) {
      clearTimeout(soundTimeout)
      soundTimeout = null
    }

    const now = audioContext.currentTime
    const osc = audioContext.createOscillator()
    const gain = audioContext.createGain()

    osc.connect(gain)
    gain.connect(audioContext.destination)

    osc.frequency.setValueAtTime(1400, now)
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.04)
    osc.type = 'sine'

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

    currentOsc = osc
    osc.start(now)
    osc.stop(now + 0.04)

    soundTimeout = setTimeout(() => {
      currentOsc = null
      soundTimeout = null
    }, 80)
  }

  // ── Canvas Sizing ───────────────────────────────────────────────────────────
  function updateCanvasSize(): void {
    const container = canvas.parentElement
    if (!container) return

    const containerWidth = container.clientWidth
    // On mobile, use full width; on desktop, cap at base width
    const isMobile = window.innerWidth <= MOBILE_BREAKPOINT
    
    if (isMobile) {
      // On mobile, make canvas fill the container width
      const canvasWidth = containerWidth
      const canvasHeight = Math.round(canvasWidth * (BASE_CANVAS_H / BASE_CANVAS_W))
      canvas.width = canvasWidth
      canvas.height = canvasHeight
      state.scale = canvasWidth / BASE_CANVAS_W
    } else {
      // On desktop, use base dimensions
      canvas.width = BASE_CANVAS_W
      canvas.height = BASE_CANVAS_H
      state.scale = 1
    }
    
    draw()
  }

  // ── Draw ───────────────────────────────────────────────────────────────────
  function draw(): void {
    const scale = state.scale
    const canvasW = canvas.width
    const canvasH = canvas.height

    ctx.fillStyle = C_BG
    ctx.fillRect(0, 0, canvasW, canvasH)

    // Wall
    const wallX = BASE_WALL_X * scale
    ctx.strokeStyle = C_WALL
    ctx.lineWidth = Math.max(1, scale)
    ctx.beginPath()
    ctx.moveTo(wallX, 0)
    ctx.lineTo(wallX, canvasH)
    ctx.stroke()

    // Boxes
    const box2Size = getBox2Size(state.m2)
    const boxSize = BASE_BOX_SIZE * scale
    const scaledBox2Size = box2Size * scale

    ctx.fillStyle = C_BOX1
    ctx.fillRect(
      state.smallBoxX * scale - boxSize / 2,
      canvasH / 2 - boxSize / 2,
      boxSize,
      boxSize
    )

    ctx.fillStyle = C_BOX2
    ctx.fillRect(
      state.largeBoxX * scale - scaledBox2Size / 2,
      canvasH / 2 - scaledBox2Size / 2,
      scaledBox2Size,
      scaledBox2Size
    )

    // Labels
    ctx.fillStyle = C_TEXT
    ctx.font = `${Math.max(10, Math.round(12 * scale))}px monospace`
    const labelOffset = Math.round(40 * scale)
    ctx.fillText('Box 1 (m=1)', state.smallBoxX * scale - 30 * scale, canvasH / 2 + labelOffset)
    ctx.fillText(`Box 2 (m=${state.m2})`, state.largeBoxX * scale - 30 * scale, canvasH / 2 + labelOffset + Math.round(15 * scale))
  }

  // ── Physics ────────────────────────────────────────────────────────────────
  function getTimeToCollision(): { type: 'box' | 'wall' | 'none'; time: number } {
    const EPSILON = 1e-6
    const box2Size = getBox2Size(state.m2)

    let timeToBoxCollision = Infinity
    if (state.smallBoxV > state.largeBoxV) {
      const relVelocity = state.smallBoxV - state.largeBoxV
      const gap = (state.largeBoxX - box2Size / 2) - (state.smallBoxX + BASE_BOX_SIZE / 2)
      if (gap > -EPSILON) {
        timeToBoxCollision = gap / relVelocity
      }
    }

    let timeToWallCollision = Infinity
    if (state.smallBoxV < 0) {
      const distToWall = (state.smallBoxX - BASE_BOX_SIZE / 2) - BASE_WALL_X
      if (distToWall > -EPSILON) {
        timeToWallCollision = distToWall / -state.smallBoxV
      }
    }

    if (timeToBoxCollision < timeToWallCollision && timeToBoxCollision < Infinity) {
      return { type: 'box', time: timeToBoxCollision }
    } else if (timeToWallCollision < Infinity) {
      return { type: 'wall', time: timeToWallCollision }
    }
    return { type: 'none', time: Infinity }
  }

  function updatePhysics(timestamp: number): void {
    const elapsedTimeMS = Math.min(timestamp - state.time, 100)
    state.time = timestamp
    let timeRemaining = elapsedTimeMS / 1000

    while (timeRemaining > 1e-6) {
      const collision = getTimeToCollision()

      if (collision.time >= timeRemaining) {
        state.smallBoxX += state.smallBoxV * timeRemaining
        state.largeBoxX += state.largeBoxV * timeRemaining
        break
      }

      state.smallBoxX += state.smallBoxV * collision.time
      state.largeBoxX += state.largeBoxV * collision.time
      timeRemaining -= collision.time

      if (collision.type === 'box') {
        const m1 = M1
        const m2 = state.m2
        const v1 = state.smallBoxV
        const v2 = state.largeBoxV

        const newV1 = ((m1 - m2) / (m1 + m2)) * v1 + (2 * m2 / (m1 + m2)) * v2
        const newV2 = (2 * m1 / (m1 + m2)) * v1 + ((m2 - m1) / (m1 + m2)) * v2

        state.smallBoxV = newV1
        state.largeBoxV = newV2
        state.collisions++
        playCollisionSound()
      } else if (collision.type === 'wall') {
        state.smallBoxV = -state.smallBoxV
        state.collisions++
        playCollisionSound()
      }
    }

    if (isSimulationComplete()) {
      stop()
    }
  }

  function isSimulationComplete(): boolean {
    const box2Size = getBox2Size(state.m2)
    const boxesSeparated = state.largeBoxV > state.smallBoxV && state.smallBoxV >= 0
    const gapLargeEnough = state.largeBoxX - state.smallBoxX > 5 * Math.max(BASE_BOX_SIZE, box2Size)
    const smallBoxAwayFromWall = state.smallBoxX - BASE_BOX_SIZE / 2 > BASE_WALL_X + 5 * BASE_BOX_SIZE
    return boxesSeparated && gapLargeEnough && smallBoxAwayFromWall
  }


  // ── Animation ──────────────────────────────────────────────────────────────
  function tick(timestamp: number): void {
    if (!state.running) return

    updatePhysics(timestamp)
    draw()

    elHits.textContent = state.collisions.toString()
    const piApprox = state.collisions / (10 ** state.k)
    elPiApprox.textContent = piApprox.toFixed(state.k)

    if (state.running) {
      state.rafId = requestAnimationFrame(tick)
    }
  }

  function start(): void {
    if (state.running) return
    resetState(state)
    state.k = parseInt(elK.value)
    state.m2 = 100 ** state.k
    state.running = true
    elK.disabled = true
    elStartBtn.textContent = 'Running…'
    state.rafId = requestAnimationFrame(tick)
  }

  function stop(): void {
    state.running = false
    elK.disabled = false
    elStartBtn.textContent = 'Start'
    if (state.rafId !== null) {
      cancelAnimationFrame(state.rafId)
      state.rafId = null
    }
  }

  function reset(): void {
    stop()
    resetState(state)
    draw()
    elHits.textContent = '0'
    elPiApprox.textContent = '0'
  }

  function onKChange(): void {
    if (state.running) return
    state.k = parseInt(elK.value)
    state.m2 = 100 ** state.k
    draw()
  }

  // ── Build DOM ─────────────────────────────────────────────────────────────
  function render(): HTMLElement {
    const page = document.createElement('div')
    page.className = 'page'

    page.innerHTML = `
<header class="page-header">
  <span class="page-index">Method ${getMethodIndex('bouncing-boxes')}</span>
  <h2 class="page-title">Bouncing Boxes</h2>
  <p class="page-subtitle">
    Elastic collisions between two masses reveal π's digits.
  </p>
</header>

<div class="viz-layout">
  <!-- Canvas -->
  <div>
    <div class="canvas-wrapper canvas-wrapper-bouncing">
      <canvas id="bb-canvas"></canvas>
    </div>
    <div style="margin-top:14px" class="controls">
      <select id="bb-k" class="control-select">
        <option value="0">k=0 (1 digit)</option>
        <option value="1">k=1 (2 digits)</option>
        <option value="2">k=2 (3 digits)</option>
        <option value="3">k=3 (4 digits)</option>
        <option value="4">k=4 (5 digits)</option>
      </select>
      <button id="bb-start" class="btn primary">Start</button>
      <button id="bb-reset" class="btn">Reset</button>
    </div>
  </div>

  <!-- Stats -->
  <div class="stats-panel">
    <div class="stat-card">
      <div class="stat-label">π approximation</div>
      <div class="stat-value large" id="bb-pi-approx">0.0</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Collisions</div>
      <div class="stat-value" id="bb-hits">0</div>
    </div>
    <div class="explanation">
      <h3>The Bouncing Boxes Method</h3>
      <p>
        Two boxes with masses 1 and 100^k collide elastically. The number of times
        the smaller box hits the wall after the first collision gives the first k+1
        digits of π.
      </p>
      <p>
        For k=1, 31 hits → π ≈ 3.1<br>
        For k=2, 314 hits → π ≈ 3.14
      </p>
    </div>
  </div>
</div>
`

    canvas = queryRequired(page, '#bb-canvas', HTMLCanvasElement)
    elK = queryRequired(page, '#bb-k', HTMLSelectElement)
    elHits = queryRequired(page, '#bb-hits')
    elPiApprox = queryRequired(page, '#bb-pi-approx')
    elStartBtn = queryRequired(page, '#bb-start', HTMLButtonElement)
    elResetBtn = queryRequired(page, '#bb-reset', HTMLButtonElement)

    ctx = getCanvasContext2D(canvas)
    
    // Set up resize handling
    resizeObserver = new ResizeObserver(() => {
      updateCanvasSize()
    })
    resizeObserver.observe(canvas.parentElement!)
    
    // Initial size
    updateCanvasSize()

    elStartBtn.addEventListener('click', start)
    elResetBtn.addEventListener('click', reset)
    elK.addEventListener('change', onKChange)

    return page
  }

  function cleanup(): void {
    stop()
    if (soundTimeout) clearTimeout(soundTimeout)
    if (resizeObserver) resizeObserver.disconnect()
  }

  return { render, cleanup }
}
