# Architecture & Refactoring Patterns

This document describes the architecture patterns used in the SearchingForPi project and provides guidance for implementing new method pages.

## Directory Structure

Each method follows a consistent module structure:

```
src/methods/<methodName>/
├── index.ts          # Module barrel export
├── page.ts           # Page factory (minimal, delegates to controller)
├── controller.ts     # Animation control logic (NEW)
├── types.ts          # State interface and constants
├── rendering.ts      # Canvas drawing functions
└── [domain].ts       # Domain-specific logic (physics, sampling, etc.)
```

## Key Abstractions

### 1. Controller Pattern

The controller pattern separates animation control logic from page configuration. This makes the code easier to follow and test.

**Before (all in page.ts):**
```typescript
// page.ts - 150+ lines with nested functions
export const createMyMethodPage = createMethodPageFactory<State>(
  { /* config */ },
  createInitialState(),
  {
    init(ctx) {
      // 100+ lines of animation logic, button wiring, stats updates
      function tick() { /* ... */ }
      function start() { /* ... */ }
      function stop() { /* ... */ }
      function reset() { /* ... */ }
      function updateStats() { /* ... */ }
      // ... more nested functions
    },
  }
)
```

**After (split into controller):**
```typescript
// page.ts - ~50 lines, clean configuration
export const createMyMethodPage = createMethodPageFactory<State>(
  { /* config */ },
  createInitialState(),
  {
    init(ctx) {
      const statsElements = { /* ... */ }
      const controller = createMyMethodController(ctx, statsElements)
      ;(ctx.state as any)._controller = controller
    },
    cleanup(ctx) {
      (ctx.state as any)._controller?.cleanup()
    },
  }
)

// controller.ts - focused on animation logic
export function createMyMethodController(
  ctx: MethodPageContext<State>,
  elements: StatsElements
): AnimationController {
  // Clear separation of concerns
}
```

### 2. Animation Controllers

Use the appropriate controller from `../base/controller`:

- **`createFrameController`** - For frame-based animations (requestAnimationFrame)
  - Best for: continuous simulations, physics-based methods
  - Example: Monte Carlo, Bouncing Boxes

- **`createIntervalController`** - For fixed-timestep animations (setInterval)
  - Best for: series/sequence visualizations
  - Example: Leibniz Series

```typescript
// Frame-based controller
const controller = createFrameController({
  ctx,
  buttons: { btnStart, btnStep, btnReset },
  update: (state, dt) => { /* update state */ },
  draw: () => { /* render */ },
  isComplete: (state) => state.total >= MAX,
  onReset: () => { /* reset state */ },
  onStep: () => { /* single step */ },
})

// Interval-based controller
const controller = createIntervalController({
  ctx,
  buttons: { btnStart, btnStep, btnReset },
  intervalMs: 40,
  tick: () => { /* called each interval */ },
  isComplete: (state) => state.termIndex >= MAX_TERMS,
  onReset: () => { /* reset state */ },
})
```

### 3. Stats Management

Extract stats element references and update logic:

```typescript
// controller.ts
export interface StatsElements {
  estimate: HTMLElement
  total: HTMLElement
  error?: HTMLElement
}

export function createStatsUpdater(
  elements: StatsElements,
  state: State
): () => void {
  return function updateStats(): void {
    elements.estimate.textContent = fmt(state.pi)
    elements.total.textContent = state.count.toLocaleString()
  }
}
```

### 4. Stats Panel Builder

Use the fluent API for building stats panels:

```typescript
import { buildStatsPanel } from '../base/page'

statsPanel: buildStatsPanel()
  .addPiEstimate('estimate', { error: true, progress: true })
  .addCounter('total', 'Points plotted', { subtext: 'of 20,000 total' })
  .addLegend([
    { color: C_INSIDE, text: 'Inside circle' },
    { color: C_OUTSIDE, text: 'Outside circle' },
  ])
  .addExplanation('How it works', [
    'Description paragraph 1',
    'Description paragraph 2',
  ], 'π ≈ 4 × (inside / total)')
  .build()
```

## Implementing a New Method

### Step 1: Create Module Structure

```bash
src/methods/myMethod/
├── index.ts
├── page.ts
├── controller.ts
├── types.ts
├── rendering.ts
└── domain.ts
```

### Step 2: Define Types (types.ts)

```typescript
export interface State {
  running: boolean
  rafId: number | null
  intervalId: ReturnType<typeof setInterval> | null
  // ... method-specific state
}

export function createInitialState(): State {
  return {
    running: false,
    rafId: null,
    intervalId: null,
    // ...
  }
}
```

### Step 3: Create Controller (controller.ts)

```typescript
import type { MethodPageContext } from '../base/page/types'
import { createFrameController } from '../base/controller'

export interface StatsElements {
  // Define your stats elements
}

export function createMyMethodController(
  ctx: MethodPageContext<State>,
  elements: StatsElements
) {
  // Create stats updater
  const updateStats = createStatsUpdater(elements, ctx.state)
  
  // Create animation controller
  return createFrameController({
    ctx,
    buttons: { btnStart, btnStep, btnReset },
    update: (state, dt) => { /* ... */ },
    draw: () => updateStats(),
    onReset: () => { /* ... */ },
  })
}
```

### Step 4: Create Page Factory (page.ts)

```typescript
import { createMethodPageFactory, statCard, legend, explanation } from '../base/page'
import { State, createInitialState, CONSTANTS } from './types'
import { createMyMethodController, StatsElements } from './controller'

export const createMyMethodPage = createMethodPageFactory<State>(
  {
    title: 'My Method',
    subtitle: 'Description',
    index: 'XX',
    canvasWidth: 560,
    canvasHeight: 560,
    controls: `
      <button class="btn primary" id="btn-start">Start</button>
      <button class="btn" id="btn-step">Step</button>
      <button class="btn" id="btn-reset" disabled>Reset</button>
    `,
    statsPanel: `...`,
  },
  createInitialState(),
  {
    init(ctx) {
      const { $id } = ctx
      const elements: StatsElements = {
        // Get element references
      }
      const controller = createMyMethodController(ctx, elements)
      ;(ctx.state as any)._controller = controller
    },
    cleanup(ctx) {
      (ctx.state as any)._controller?.cleanup()
    },
  }
)
```

### Step 5: Register in definitions.ts

```typescript
// src/methods/definitions.ts
export const methodPages: PageInfo[] = [
  // ... existing methods
  {
    hash: 'my-method',
    title: 'My Method',
    desc: 'Description for the home page card',
    index: 'XX',
  },
]
```

## Best Practices

1. **Keep page.ts minimal** - Only configuration and delegation
2. **Controller handles animation** - All animation logic in controller.ts
3. **Stats updaters are pure functions** - Easy to test and reason about
4. **Use TypeScript interfaces** - Define StatsElements for type safety
5. **Clean up resources** - Always implement cleanup() to stop animations and free resources
6. **Follow existing patterns** - Look at monteCarlo, leibniz, or bouncingBoxes as examples

## File Size Guidelines

| File | Target Lines | Purpose |
|------|--------------|---------|
| page.ts | 40-60 | Configuration only |
| controller.ts | 80-120 | Animation logic |
| types.ts | 30-50 | State and constants |
| rendering.ts | 50-100 | Drawing functions |
| domain.ts | varies | Domain-specific logic |

If a file exceeds these guidelines, consider further decomposition.
