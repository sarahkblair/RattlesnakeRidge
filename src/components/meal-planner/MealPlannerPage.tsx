'use client'

import { useState, useEffect, useCallback } from 'react'
import { WeeklyGrid } from './WeeklyGrid'
import { WeekNav } from './WeekNav'
import { VaultDrawer } from './VaultDrawer'
import { RecipePickerModal } from './RecipePickerModal'
import { KitchenAssistant } from './KitchenAssistant'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/layout/ToastProvider'
import { getMonday, formatWeekStart, nextWeek, prevWeek, parseWeekStart } from '@/lib/week-utils'
import type { Recipe, WeekPlan, CreateRecipeBody } from '@/types'
import { DAY_LABELS, SLOTS } from '@/types'

export function MealPlannerPage() {
  const { toast } = useToast()

  // ── Week state ────────────────────────────────────────────
  const [weekStart, setWeekStart] = useState<string>(() =>
    formatWeekStart(getMonday(new Date()))
  )

  // ── Data state ────────────────────────────────────────────
  const [recipes,  setRecipes]  = useState<Recipe[]>([])
  const [weekPlan, setWeekPlan] = useState<WeekPlan>([])
  const [loading,  setLoading]  = useState(true)

  // ── UI state ──────────────────────────────────────────────
  const [vaultOpen, setVaultOpen] = useState(false)
  const [syncing,   setSyncing]   = useState(false)
  const [clearing,  setClearing]  = useState(false)

  // Picker modal state
  const [pickerOpen,    setPickerOpen]    = useState(false)
  const [pickerDay,     setPickerDay]     = useState(0)
  const [pickerSlot,    setPickerSlot]    = useState<'main' | 'also'>('main')

  // ── Fetch helpers ─────────────────────────────────────────

  const fetchRecipes = useCallback(async () => {
    try {
      const res = await fetch('/api/recipes')
      if (!res.ok) throw new Error('Failed to fetch recipes')
      setRecipes(await res.json())
    } catch (err) {
      console.error(err)
    }
  }, [])

  const fetchWeekPlan = useCallback(async (ws: string) => {
    try {
      const res = await fetch(`/api/meal-plan?weekStart=${ws}`)
      if (!res.ok) throw new Error('Failed to fetch meal plan')
      setWeekPlan(await res.json())
    } catch (err) {
      console.error(err)
    }
  }, [])

  // ── Initial load ──────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchRecipes(), fetchWeekPlan(weekStart)])
      setLoading(false)

      // Fire-and-forget background sync from Google Doc
      fetch('/api/google-sync', { method: 'POST' })
        .then(r => r.json())
        .then(data => {
          if (data.synced > 0) {
            fetchRecipes()
            toast(`Synced ${data.synced} recipe${data.synced > 1 ? 's' : ''} from Google Doc`, 'info')
          }
        })
        .catch(() => {/* Google Doc unavailable — silently use SQLite data */})
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-fetch when week changes
  useEffect(() => {
    fetchWeekPlan(weekStart)
  }, [weekStart, fetchWeekPlan])

  // ── Week navigation ───────────────────────────────────────
  const handlePrevWeek = () => {
    setWeekStart(ws => formatWeekStart(prevWeek(parseWeekStart(ws))))
  }
  const handleNextWeek = () => {
    setWeekStart(ws => formatWeekStart(nextWeek(parseWeekStart(ws))))
  }

  // ── Cell actions ──────────────────────────────────────────
  const handleCellClick = (day: number, slot: 'main' | 'also') => {
    setPickerDay(day)
    setPickerSlot(slot)
    setPickerOpen(true)
  }

  const handleCellRemove = async (day: number, slot: 'main' | 'also') => {
    try {
      await fetch('/api/meal-plan', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStart, dayOfWeek: day, slot }),
      })
      setWeekPlan(prev => prev.filter(e => !(e.dayOfWeek === day && e.slot === slot)))
    } catch {
      toast('Failed to remove recipe from plan', 'error')
    }
  }

  const handleAssignRecipe = async (recipe: Recipe) => {
    const res = await fetch('/api/meal-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weekStart,
        dayOfWeek: pickerDay,
        slot: pickerSlot,
        recipeId: recipe.id,
      }),
    })
    if (!res.ok) throw new Error('Failed to assign recipe')
    const entry = await res.json()

    setWeekPlan(prev => {
      const filtered = prev.filter(
        e => !(e.dayOfWeek === pickerDay && e.slot === pickerSlot)
      )
      return [...filtered, entry]
    })

    const slotLabel = SLOTS.find(s => s.key === pickerSlot)?.label ?? pickerSlot
    toast(`${recipe.emoji} ${recipe.name} → ${DAY_LABELS[pickerDay]} ${slotLabel}`)
  }

  // ── Add to week (from Vault) ──────────────────────────────
  const handleAddToWeek = async (recipeId: number, day: number, slot: 'main' | 'also') => {
    const recipe = recipes.find(r => r.id === recipeId)
    if (!recipe) return

    const res = await fetch('/api/meal-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekStart, dayOfWeek: day, slot, recipeId }),
    })
    if (!res.ok) throw new Error('Failed to add to week')
    const entry = await res.json()

    setWeekPlan(prev => {
      const filtered = prev.filter(e => !(e.dayOfWeek === day && e.slot === slot))
      return [...filtered, entry]
    })

    const slotLabel = SLOTS.find(s => s.key === slot)?.label ?? slot
    toast(`${recipe.emoji} ${recipe.name} → ${DAY_LABELS[day]} ${slotLabel}`)
  }

  // ── Clear week ────────────────────────────────────────────
  const handleClearWeek = async () => {
    if (!confirm('Clear all meals for this week?')) return
    setClearing(true)
    try {
      const res = await fetch(`/api/meal-plan/clear?weekStart=${weekStart}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Clear failed')
      setWeekPlan([])
      toast('Week cleared')
    } catch {
      toast('Failed to clear week', 'error')
    } finally {
      setClearing(false)
    }
  }

  // ── Manual sync ───────────────────────────────────────────
  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/google-sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error ?? 'Sync failed', 'error')
      } else {
        await fetchRecipes()
        toast(`Synced ${data.synced} recipe${data.synced !== 1 ? 's' : ''} from Google Doc`)
      }
    } catch {
      toast('Sync failed — check your Google credentials', 'error')
    } finally {
      setSyncing(false)
    }
  }

  // ── Save new recipe (from Add form) ──────────────────────
  const handleSaveRecipe = async (data: CreateRecipeBody) => {
    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Failed to save recipe')

    setRecipes(prev => [...prev, json].sort((a, b) => a.name.localeCompare(b.name)))
    toast(`${json.emoji} ${json.name} saved to vault`)
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      {/* ── Page header ──────────────────────────────────── */}
      <div className="border-b border-gold/30 bg-cream/60 sticky top-0 z-30 backdrop-blur-sm">
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-brown leading-tight">Meal Planner</h1>
            <p className="font-body text-sm text-brown/60 mt-0.5">
              Plan your week, one good meal at a time
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Vault button */}
            <button
              onClick={() => setVaultOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-saddle hover:bg-saddle-dark text-parchment rounded-xl text-sm font-body font-medium shadow-warm transition-all duration-150"
            >
              <span className="text-base">📖</span>
              Vault
            </button>
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────── */}
      <div className="px-6 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <Spinner size="lg" className="text-saddle" />
              <p className="font-body text-sm text-brown/60">Loading your homestead hub…</p>
            </div>
          </div>
        ) : (
          <>
            {/* Week navigation */}
            <WeekNav
              weekStart={weekStart}
              onPrev={handlePrevWeek}
              onNext={handleNextWeek}
              onClear={handleClearWeek}
              clearing={clearing}
            />

            {/* Planner grid */}
            <div className="bg-parchment border border-gold/30 rounded-2xl shadow-warm p-4">
              <WeeklyGrid
                weekStart={weekStart}
                weekPlan={weekPlan}
                onCellClick={handleCellClick}
                onCellRemove={handleCellRemove}
              />
            </div>

            {/* Kitchen assistant */}
            <KitchenAssistant
              recipes={recipes}
              weekPlan={weekPlan}
              weekStart={weekStart}
            />
          </>
        )}
      </div>

      {/* ── Recipe Vault Drawer ───────────────────────────── */}
      <VaultDrawer
        open={vaultOpen}
        onClose={() => setVaultOpen(false)}
        recipes={recipes}
        syncing={syncing}
        onSync={handleSync}
        onAddToWeek={handleAddToWeek}
        onSaveRecipe={handleSaveRecipe}
      />

      {/* ── Recipe Picker Modal (cell click) ─────────────── */}
      <RecipePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        dayOfWeek={pickerDay}
        slot={pickerSlot}
        recipes={recipes}
        onSelect={handleAssignRecipe}
      />
    </div>
  )
}
