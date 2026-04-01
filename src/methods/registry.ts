import type { PageFactory } from '../router'

// ─── Page Metadata ───────────────────────────────────────────────────────────

export interface PageMeta {
  /** URL hash for routing (e.g., 'monte-carlo') */
  hash: string
  /** Display title */
  title: string
  /** Short description for cards */
  desc: string
  /** Category for grouping */
  category?: 'geometric' | 'probabilistic' | 'series' | 'interactive'
}

// ─── Page Registry Entry ─────────────────────────────────────────────────────

export interface PageRegistryEntry {
  meta: PageMeta
  factory: PageFactory
  previewRenderer?: (ctx: CanvasRenderingContext2D, time: number) => void
}

// ─── Registry Implementation ────────────────────────────────────────────────

const registry = new Map<string, PageRegistryEntry>()

/**
 * Register a page with its metadata and factory.
 */
export function registerPageEntry(entry: PageRegistryEntry): void {
  registry.set(entry.meta.hash, entry)
}

/**
 * Register multiple pages at once.
 */
export function registerPages(entries: PageRegistryEntry[]): void {
  entries.forEach(registerPageEntry)
}

/**
 * Get a page entry by hash.
 */
export function getPageEntry(hash: string): PageRegistryEntry | undefined {
  return registry.get(hash)
}

/**
 * Get a page factory by hash.
 */
export function getPageFactory(hash: string): PageFactory | undefined {
  return registry.get(hash)?.factory
}

/**
 * Get all page metadata (for navigation/cards).
 */
export function getAllPageMeta(): PageMeta[] {
  return Array.from(registry.values()).map(e => e.meta)
}

/**
 * Get all page metadata except home.
 */
export function getMethodPageMeta(): PageMeta[] {
  return Array.from(registry.values())
    .filter(e => e.meta.hash !== 'home')
    .map(e => e.meta)
}

/**
 * Get all preview renderers.
 */
export function getPreviewRenderers(): Record<string, (ctx: CanvasRenderingContext2D, time: number) => void> {
  const renderers: Record<string, (ctx: CanvasRenderingContext2D, time: number) => void> = {}
  for (const [hash, entry] of registry) {
    if (entry.previewRenderer) {
      renderers[hash] = entry.previewRenderer
    }
  }
  return renderers
}

// ─── Helper to Create Registry Entries ──────────────────────────────────────

export interface PageDefinition {
  hash: string
  title: string
  desc: string
  category?: PageMeta['category']
  factory: PageFactory
  previewRenderer?: (ctx: CanvasRenderingContext2D, time: number) => void
}

/**
 * Creates a registry entry from a page definition.
 * This is a convenience function for method files.
 */
export function definePage(def: PageDefinition): PageRegistryEntry {
  return {
    meta: {
      hash: def.hash,
      title: def.title,
      desc: def.desc,
      category: def.category,
    },
    factory: def.factory,
    previewRenderer: def.previewRenderer,
  }
}
