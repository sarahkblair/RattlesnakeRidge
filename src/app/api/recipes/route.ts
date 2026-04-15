import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { appendRecipeToGoogleDoc } from '@/lib/google-docs'
import type { CreateRecipeBody } from '@/types'

// ── Serialize a Prisma Recipe row → API Recipe (split strings to arrays) ──
function serializeRecipe(r: {
  id: number
  name: string
  category: string
  cuisine: string
  emoji: string
  ingredients: string
  steps: string
  source: string
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...r,
    ingredients: r.ingredients ? r.ingredients.split('\n').filter(Boolean) : [],
    steps: r.steps ? r.steps.split('\n').filter(Boolean) : [],
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
}

// ── GET /api/recipes — list all recipes ───────────────────────
export async function GET() {
  try {
    const rows = await prisma.recipe.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(rows.map(serializeRecipe))
  } catch (err) {
    console.error('[GET /api/recipes]', err)
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 })
  }
}

// ── POST /api/recipes — create a new recipe ───────────────────
export async function POST(req: Request) {
  try {
    const body: CreateRecipeBody = await req.json()
    const { name, category, cuisine, emoji, ingredients, steps } = body

    if (!name?.trim() || !category?.trim() || !cuisine?.trim()) {
      return NextResponse.json(
        { error: 'name, category, and cuisine are required' },
        { status: 400 }
      )
    }

    const row = await prisma.recipe.create({
      data: {
        name: name.trim(),
        category: category.trim(),
        cuisine: cuisine.trim(),
        emoji: emoji?.trim() || '🍽️',
        ingredients: (ingredients ?? []).filter(Boolean).join('\n'),
        steps: (steps ?? []).filter(Boolean).join('\n'),
        source: 'local',
      },
    })

    const recipe = serializeRecipe(row)

    // Fire-and-forget write-back to Google Doc (never fail the response)
    appendRecipeToGoogleDoc({
      name: recipe.name,
      category: recipe.category,
      cuisine: recipe.cuisine,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
    }).catch(err => console.error('[POST /api/recipes] Google write-back failed:', err))

    return NextResponse.json(recipe, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'A recipe with that name already exists' },
        { status: 409 }
      )
    }
    console.error('[POST /api/recipes]', err)
    return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 })
  }
}
