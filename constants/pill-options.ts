// IMPORTANT: These option sets are intentionally truncated for MVP scope.
// Do NOT add new items without explicit product approval; expanding affects
// normalization, AI prompt expectations, and confidence scoring logic.
export const SHAPE_OPTIONS = ['Round', 'Oval', 'Capsule/Oblong', 'Rectangle', 'Barrel'] as const

// Single-tone colors only (keep minimal set)
export const COLOR_SINGLE_TONE = [
  'White',
  'Blue',
  'Brown',
  'Green',
  'Pink',
  'Red',
  'Yellow',
] as const

// Limited two-tone combinations supported (keep in sync with analyzer normalization)
export const COLOR_TWO_TONE = [
  'Blue & White',
  'Green & White',
  'Pink & White',
  'Red & White',
  'Yellow & White',
] as const

export const COLOR_OPTIONS = [...COLOR_SINGLE_TONE, ...COLOR_TWO_TONE] as const

// Grouped subsets remain available for UI

export type ShapeOption = (typeof SHAPE_OPTIONS)[number]
export type ColorOption = (typeof COLOR_OPTIONS)[number]

export const SCORING_OPTIONS = ['no score', '1 score', '2 scores'] as const
export type ScoringOption = (typeof SCORING_OPTIONS)[number]
