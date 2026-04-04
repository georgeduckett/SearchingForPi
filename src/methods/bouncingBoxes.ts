import { C_BG, C_TEXT_MUTED, C_INSIDE, C_AMBER, C_TEXT_PRIMARY, PREVIEW_SIZE } from '../colors'
import { clearCanvas } from './base/canvas'
import { createMethodPageFactory, statCard, explanation } from './base/page'

// ─── Constants ───────────────────────────────────────────────────────────────
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
const MOBILE_BREAKPOINT = 700

// ─── Colours ──────────────────────────────────────────────────────────────────
const C_WALL = C_TEXT_MUTED
const C_BOX1 = C_INSIDE
const C_BOX2 = C_AMBER
const C_TEXT = C_TEXT_PRIMARY

// ─── Preview Renderer ────────────────────────────────────────────────────────
export function drawPreview(ctx: CanvasRenderingContext2D, time: number): void {
  const s = PREVIEW_SIZE
  clearCanvas(ctx, s, s)

  ctx.strokeStyle = C_TEXT_MUTED
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(10, 0)
  ctx.lineTo(10, s)
  ctx.stroke()

  const x1 = 10 + Math.abs(Math.sin(time * 0.8)) * 40
  ctx.fillStyle = C_INSIDE
  ctx.fillRect(x1, s / 2 - 10, 20, 20)

  const x2 = 65 + Math.abs(Math.sin(time * 0.6)) * 30
  ctx.fillStyle = C_AMBER
  ctx.fillRect(x2, s / 2 - 10, 20, 20)
}

// ─── State ───────────────────────────────────────────────────────────────────
interface State {
  k: number
  m2: number
  smallBoxX: number
  smallBoxV: number
  largeBoxX: number
  largeBoxV: number
  collisions: number
  running: boolean
  rafId: number | null
  time: number
  scale: number
  pendingCollisions: number
  simulationComplete: boolean
  vibrationOffset: number
  audioContext: AudioContext | null
  currentOsc: OscillatorNode | null
  soundTimeout: ReturnType<typeof setTimeout> | null
  resizeObserver: ResizeObserver | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getBox2Size(m2: number): number {
  const minMass = 1
  const maxMass = 100_000_000
  const t = (Math.log10(m2) - Math.log10(minMass)) / (Math.log10(maxMass) - Math.log10(minMass))
  return BASE_BOX2_MIN_SIZE + t * (BASE_BOX2_MAX_SIZE - BASE_BOX2_MIN_SIZE)
}

// ─── Page Factory ─────────────────────────────────────────────────────────────
export const createBouncingBoxesPage = createMethodPageFactory<State>(
  {
    title: 'Bouncing Boxes',
    subtitle: "Elastic collisions between two masses reveal π's digits.",
    index: '05',
    canvasWidth: BASE_CANVAS_W,
    canvasHeight: BASE_CANVAS_H,
    controls: `
      <select id="select-k" class="control-select">
        <option value="0">k=0</option>
        <option value="1">k=1</option>
        <option value="2">k=2</option>
        <option value="3">k=3</option>
        <option value="4">k=4</option>
      </select>
      <button class="btn primary" id="btn-start">Start</button>
      <button class="btn" id="btn-reset">Reset</button>
    `,
    statsPanel: `
      ${statCard('π approximation', 'pi-approx', { valueClass: 'stat-value large' })}
      ${statCard('Collisions', 'hits')}
      ${explanation('The Bouncing Boxes Method', [
        'Two boxes with masses 1 and 100^k collide elastically. The number of times the smaller box hits the wall after the first collision gives the first k+1 digits of π.',
        'For k=1, 31 hits → π ≈ 3.1<br>For k=2, 314 hits → π ≈ 3.14',
      ])}
    `,
  },
  {
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
    pendingCollisions: 0,
    simulationComplete: false,
    vibrationOffset: 0,
    audioContext: null,
    currentOsc: null,
    soundTimeout: null,
    resizeObserver: null,
  },
  {
    init(ctx) {
      const { ctx: ctx2d, state, $id } = ctx

      // Get element references
      const elK = $id('select-k', HTMLSelectElement)
      const elHits = $id('hits', HTMLElement)
      const elPiApprox = $id('pi-approx', HTMLElement)
      const btnStart = $id('btn-start', HTMLButtonElement)
      const btnReset = $id('btn-reset', HTMLButtonElement)

      // Sound
      function playCollisionSound(): void {
        if (!state.audioContext) {
          state.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        }

        if (state.currentOsc) {
          state.currentOsc.stop()
          state.currentOsc = null
        }
        if (state.soundTimeout) {
          clearTimeout(state.soundTimeout)
          state.soundTimeout = null
        }

        const now = state.audioContext.currentTime
        const osc = state.audioContext.createOscillator()
        const gain = state.audioContext.createGain()

        osc.connect(gain)
        gain.connect(state.audioContext.destination)

        osc.frequency.setValueAtTime(1400, now)
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.04)
        osc.type = 'sine'

        gain.gain.setValueAtTime(0.15, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

        state.currentOsc = osc
        osc.start(now)
        osc.stop(now + 0.04)

        state.soundTimeout = setTimeout(() => {
          state.currentOsc = null
          state.soundTimeout = null
        }, 80)
      }

      // Canvas sizing
      function updateCanvasSize(): void {
        const container = ctx.canvas.parentElement
        if (!container) return

        const containerWidth = container.clientWidth
        const isMobile = window.innerWidth <= MOBILE_BREAKPOINT

        if (isMobile) {
          const canvasWidth = containerWidth
          const canvasHeight = Math.round(canvasWidth * (BASE_CANVAS_H / BASE_CANVAS_W))
          ctx.canvas.width = canvasWidth
          ctx.canvas.height = canvasHeight
          state.scale = canvasWidth / BASE_CANVAS_W
        } else {
          ctx.canvas.width = BASE_CANVAS_W
          ctx.canvas.height = BASE_CANVAS_H
          state.scale = 1
        }

        draw()
      }

      // Draw
      function draw(): void {
        const scale = state.scale
        const canvasW = ctx.canvas.width
        const canvasH = ctx.canvas.height

        ctx2d.fillStyle = C_BG
        ctx2d.fillRect(0, 0, canvasW, canvasH)

        const wallX = BASE_WALL_X * scale
        ctx2d.strokeStyle = C_WALL
        ctx2d.lineWidth = Math.max(1, scale)
        ctx2d.beginPath()
        ctx2d.moveTo(wallX, 0)
        ctx2d.lineTo(wallX, canvasH)
        ctx2d.stroke()

        const box2Size = getBox2Size(state.m2)
        const boxSize = BASE_BOX_SIZE * scale
        const scaledBox2Size = box2Size * scale

        const vibrationX = state.vibrationOffset * scale
        ctx2d.fillStyle = C_BOX1
        ctx2d.fillRect(
          state.smallBoxX * scale - boxSize / 2 + vibrationX,
          canvasH / 2 - boxSize / 2,
          boxSize,
          boxSize
        )

        ctx2d.fillStyle = C_BOX2
        ctx2d.fillRect(
          state.largeBoxX * scale - scaledBox2Size / 2,
          canvasH / 2 - scaledBox2Size / 2,
          scaledBox2Size,
          scaledBox2Size
        )

        ctx2d.fillStyle = C_TEXT
        ctx2d.font = `${Math.max(10, Math.round(12 * scale))}px monospace`
        const labelOffset = Math.round(40 * scale)
        ctx2d.fillText('Box 1 (m=1)', state.smallBoxX * scale - 30 * scale, canvasH / 2 + labelOffset)
        ctx2d.fillText(`Box 2 (m=${state.m2})`, state.largeBoxX * scale - 30 * scale, canvasH / 2 + labelOffset + Math.round(15 * scale))
      }

      // Physics
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

      const MAX_COLLISIONS_PER_FRAME = 461

      function updatePhysics(timestamp: number): void {
        const elapsedTimeMS = Math.min(timestamp - state.time, 100)
        state.time = timestamp
        let timeRemaining = elapsedTimeMS / 1000
        let collisionsThisFrame = 0

        while (timeRemaining > 1e-6 && collisionsThisFrame < MAX_COLLISIONS_PER_FRAME) {
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
            collisionsThisFrame++
            playCollisionSound()
          } else if (collision.type === 'wall') {
            state.smallBoxV = -state.smallBoxV
            state.collisions++
            collisionsThisFrame++
            playCollisionSound()
          }
        }

        if (collisionsThisFrame > 10) {
          const intensity = Math.min(collisionsThisFrame / 100, 0.2)
          state.vibrationOffset = (Math.random() - 0.5) * intensity * BASE_BOX_SIZE * 0.3
        } else {
          state.vibrationOffset *= 0.5
        }

        if (isSimulationComplete()) {
          state.simulationComplete = true
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
        resetState()
        state.k = parseInt(elK.value)
        state.m2 = 100 ** state.k
        state.running = true
        elK.disabled = true
        btnStart.textContent = 'Running…'
        state.rafId = requestAnimationFrame(tick)
      }

      function stop(): void {
        state.running = false
        elK.disabled = false
        btnStart.textContent = 'Start'
        if (state.rafId !== null) {
          cancelAnimationFrame(state.rafId)
          state.rafId = null
        }
      }

      function resetState(): void {
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
        state.pendingCollisions = 0
        state.simulationComplete = false
        state.vibrationOffset = 0
      }

      function reset(): void {
        stop()
        resetState()
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

      // Set up resize handling
      state.resizeObserver = new ResizeObserver(() => {
        updateCanvasSize()
      })
      state.resizeObserver.observe(ctx.canvas.parentElement!)

      // Initial size
      updateCanvasSize()

      // Wire up events
      btnStart.addEventListener('click', start)
      btnReset.addEventListener('click', reset)
      elK.addEventListener('change', onKChange)
    },

    cleanup(ctx) {
      const { state } = ctx
      state.running = false
      if (state.rafId !== null) {
        cancelAnimationFrame(state.rafId)
        state.rafId = null
      }
      if (state.soundTimeout) clearTimeout(state.soundTimeout)
      if (state.resizeObserver) state.resizeObserver.disconnect()
    },
  }
)
