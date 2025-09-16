import {
  COLOR_OPTIONS,
  ColorOption,
  SCORING_OPTIONS,
  ScoringOption,
  SHAPE_OPTIONS,
  ShapeOption,
} from '@/constants/pill-options'

export function normalizeShape(input?: string): ShapeOption | '' {
  const s = (input || '').toLowerCase().trim()
  const map: Record<string, ShapeOption> = {
    round: 'Round',
    circle: 'Round',
    oval: 'Oval',
    oblong: 'Capsule/Oblong',
    capsule: 'Capsule/Oblong',
    rectangle: 'Rectangle',
    rectangular: 'Rectangle',
    square: 'Four-sided',
    'four-sided': 'Four-sided',
    triangle: 'Three-sided',
    'three-sided': 'Three-sided',
    pentagon: 'Five-sided',
    'five-sided': 'Five-sided',
    hexagon: 'Six-sided',
    'six-sided': 'Six-sided',
    heptagon: 'Seven-sided',
    'seven-sided': 'Seven-sided',
    octagon: 'Eight-sided',
    'eight-sided': 'Eight-sided',
    heart: 'Heart-shape',
    kidney: 'Kidney-shape',
    egg: 'Egg-shape',
    barrel: 'Barrel',
    u: 'U-shape',
    'u-shape': 'U-shape',
    'figure eight': 'Figure eight-shape',
    'figure-eight': 'Figure eight-shape',
    character: 'Character-shape',
    gear: 'Gear-shape',
  }
  const candidate =
    map[s] ?? (SHAPE_OPTIONS as readonly string[]).find((o) => o.toLowerCase() === s)
  return (candidate as ShapeOption) || ''
}

export function normalizeColor(input?: string): ColorOption | '' {
  const s = (input || '').toLowerCase().trim().replace(/\s+/g, ' ')
  const exact = (COLOR_OPTIONS as readonly string[]).find((o) => o.toLowerCase() === s)
  if (exact) return exact as ColorOption
  const and = s.replace(' and ', ' & ')
  const title = and.replace(/\b\w/g, (c) => c.toUpperCase())
  const guess = (COLOR_OPTIONS as readonly string[]).find((o) => o === title)
  return (guess as ColorOption) || ''
}

export function normalizeScoring(input?: string): ScoringOption {
  const s = (input || '').toLowerCase().trim()
  if ((SCORING_OPTIONS as readonly string[]).includes(s)) return s as ScoringOption
  if (s.includes('2')) return '2 scores'
  if (s.includes('1')) return '1 score'
  return 'no score' // treat "unclear" or empty as "no score"
}
