// ── Recipe ────────────────────────────────────────────────────
export interface Recipe {
  id: number
  name: string
  category: string
  cuisine: string
  emoji: string
  ingredients: string[]
  steps: string[]
  source: string
  createdAt: string
  updatedAt: string
}

// ── Meal Plan ─────────────────────────────────────────────────
export interface MealPlanEntry {
  id: number
  weekStart: string      // "YYYY-MM-DD" of Monday
  dayOfWeek: number      // 0=Mon … 6=Sun
  slot: 'main' | 'also'
  recipeId: number | null
  recipe: Recipe | null
}

export type WeekPlan = MealPlanEntry[]

// ── Day / Slot constants ──────────────────────────────────────
export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
export const DAY_NAMES  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6

export const SLOTS = [
  { key: 'main' as const, label: 'Main Meal' },
  { key: 'also' as const, label: 'Also Making' },
]

// ── Module nav items ──────────────────────────────────────────
export interface NavItem {
  key: string
  label: string
  emoji: string
  href: string
  active: boolean
  comingSoon: boolean
}

// ── Chat / Kitchen Assistant ──────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// ── API shapes ────────────────────────────────────────────────
export interface CreateRecipeBody {
  name: string
  category: string
  cuisine: string
  emoji: string
  ingredients: string[]
  steps: string[]
}

export interface UpsertMealPlanBody {
  weekStart: string
  dayOfWeek: number
  slot: 'main' | 'also'
  recipeId: number
}

export interface AssistantRequestBody {
  messages: ChatMessage[]
  context: {
    recipes: Pick<Recipe, 'id' | 'name' | 'category' | 'cuisine' | 'emoji'>[]
    weekPlan: WeekPlan
  }
}
