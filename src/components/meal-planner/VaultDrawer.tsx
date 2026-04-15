'use client'

import { useMemo, useState } from 'react'
import { RecipeCard } from './RecipeCard'
import { AddRecipeForm } from './AddRecipeForm'
import { Spinner } from '@/components/ui/Spinner'
import type { Recipe, CreateRecipeBody } from '@/types'

type Tab = 'browse' | 'add'

interface VaultDrawerProps {
  open: boolean
  onClose: () => void
  recipes: Recipe[]
  syncing: boolean
  onSync: () => void
  onAddToWeek: (recipeId: number, dayOfWeek: number, slot: 'main' | 'also') => Promise<void>
  onSaveRecipe: (data: CreateRecipeBody) => Promise<void>
}

export function VaultDrawer({
  open,
  onClose,
  recipes,
  syncing,
  onSync,
  onAddToWeek,
  onSaveRecipe,
}: VaultDrawerProps) {
  const [tab,      setTab]      = useState<Tab>('browse')
  const [category, setCategory] = useState('All')
  const [cuisine,  setCuisine]  = useState('All')
  const [search,   setSearch]   = useState('')

  const categories = useMemo(() => {
    const cats = Array.from(new Set(recipes.map(r => r.category))).sort()
    return ['All', ...cats]
  }, [recipes])

  const cuisines = useMemo(() => {
    const cuiss = Array.from(new Set(recipes.map(r => r.cuisine))).sort()
    return ['All', ...cuiss]
  }, [recipes])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return recipes.filter(r => {
      if (category !== 'All' && r.category !== category) return false
      if (cuisine  !== 'All' && r.cuisine  !== cuisine)  return false
      if (q && !r.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [recipes, category, cuisine, search])

  return (
    <>
      {/* ── Backdrop ──────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-brown/40"
          style={{ backdropFilter: 'blur(1px)' }}
          onClick={onClose}
        />
      )}

      {/* ── Drawer panel ──────────────────────────────────── */}
      <div
        className={[
          'vault-drawer fixed right-0 top-0 h-screen w-96 z-50',
          'bg-parchment border-l border-gold/30 shadow-deep',
          'flex flex-col overflow-hidden',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gold/30 flex-shrink-0 bg-cream">
          <div className="flex items-center gap-2">
            <span className="text-xl">📖</span>
            <h2 className="font-display text-xl text-brown">Recipe Vault</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Sync button */}
            <button
              onClick={onSync}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-body text-brown/70 hover:text-saddle border border-gold/40 hover:border-saddle/40 bg-parchment hover:bg-cream rounded-lg transition-all duration-150 disabled:opacity-50"
              title="Sync from Google Doc"
            >
              {syncing ? (
                <Spinner size="sm" className="text-saddle" />
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Sync
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-brown/50 hover:text-saddle hover:bg-cream rounded-lg transition-colors duration-150"
              aria-label="Close vault"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gold/30 flex-shrink-0 bg-cream">
          {(['browse', 'add'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                'flex-1 py-3 text-sm font-body font-medium transition-all duration-150',
                tab === t
                  ? 'text-saddle border-b-2 border-saddle'
                  : 'text-brown/60 hover:text-brown border-b-2 border-transparent',
              ].join(' ')}
            >
              {t === 'browse' ? `Browse (${recipes.length})` : '+ Add Recipe'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'browse' ? (
            <div className="p-4 space-y-4">
              {/* Search */}
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search recipes..."
                className="w-full px-3 py-2.5 bg-cream border border-gold/50 rounded-lg text-sm text-brown font-body placeholder-brown/40 focus:outline-none focus:ring-2 focus:ring-saddle/40"
              />

              {/* Filters */}
              <div className="flex gap-2">
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="flex-1 px-3 py-2 bg-cream border border-gold/50 rounded-lg text-xs text-brown font-body focus:outline-none focus:ring-2 focus:ring-saddle/40"
                >
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
                <select
                  value={cuisine}
                  onChange={e => setCuisine(e.target.value)}
                  className="flex-1 px-3 py-2 bg-cream border border-gold/50 rounded-lg text-xs text-brown font-body focus:outline-none focus:ring-2 focus:ring-saddle/40"
                >
                  {cuisines.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Results count */}
              <p className="text-xs text-brown/50 font-body">
                {filtered.length} of {recipes.length} recipes
              </p>

              {/* Recipe cards */}
              {filtered.length === 0 ? (
                <div className="text-center py-12">
                  {recipes.length === 0 ? (
                    <div>
                      <p className="text-4xl mb-4">🌾</p>
                      <p className="font-display text-lg text-brown mb-2">Vault is empty</p>
                      <p className="font-body text-sm text-brown/60">
                        Sync your Google Doc or add recipes manually.
                      </p>
                    </div>
                  ) : (
                    <p className="font-body text-sm text-brown/50">No recipes match your filters.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map(recipe => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onAddToWeek={async (day, slot) => {
                        await onAddToWeek(recipe.id, day, slot)
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4">
              <AddRecipeForm onSave={onSaveRecipe} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
