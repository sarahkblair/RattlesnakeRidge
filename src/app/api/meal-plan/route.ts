import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { UpsertMealPlanBody } from '@/types'

function serializeEntry(entry: {
  id: number
  weekStart: string
  dayOfWeek: number
  slot: string
  recipeId: number | null
  createdAt: Date
  updatedAt: Date
  recipe: {
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
  } | null
}) {
  return {
    ...entry,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    recipe: entry.recipe
      ? {
          ...entry.recipe,
          ingredients: entry.recipe.ingredients.split('\n').filter(Boolean),
          steps: entry.recipe.steps.split('\n').filter(Boolean),
          createdAt: entry.recipe.createdAt.toISOString(),
          updatedAt: entry.recipe.updatedAt.toISOString(),
        }
      : null,
  }
}

// ── GET /api/meal-plan?weekStart=YYYY-MM-DD ───────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const weekStart = searchParams.get('weekStart')

  if (!weekStart) {
    return NextResponse.json({ error: 'weekStart query param required' }, { status: 400 })
  }

  try {
    const entries = await prisma.mealPlan.findMany({
      where: { weekStart },
      include: { recipe: true },
      orderBy: [{ dayOfWeek: 'asc' }, { slot: 'asc' }],
    })
    return NextResponse.json(entries.map(serializeEntry))
  } catch (err) {
    console.error('[GET /api/meal-plan]', err)
    return NextResponse.json({ error: 'Failed to fetch meal plan' }, { status: 500 })
  }
}

// ── POST /api/meal-plan — upsert a single cell ────────────────
export async function POST(req: Request) {
  try {
    const body: UpsertMealPlanBody = await req.json()
    const { weekStart, dayOfWeek, slot, recipeId } = body

    if (!weekStart || dayOfWeek === undefined || !slot || !recipeId) {
      return NextResponse.json(
        { error: 'weekStart, dayOfWeek, slot, and recipeId are required' },
        { status: 400 }
      )
    }

    const entry = await prisma.mealPlan.upsert({
      where: {
        weekStart_dayOfWeek_slot: { weekStart, dayOfWeek, slot },
      },
      update: { recipeId },
      create: { weekStart, dayOfWeek, slot, recipeId },
      include: { recipe: true },
    })

    return NextResponse.json(serializeEntry(entry))
  } catch (err) {
    console.error('[POST /api/meal-plan]', err)
    return NextResponse.json({ error: 'Failed to upsert meal plan entry' }, { status: 500 })
  }
}

// ── DELETE /api/meal-plan — remove a single cell ──────────────
export async function DELETE(req: Request) {
  try {
    const { weekStart, dayOfWeek, slot } = await req.json()

    if (!weekStart || dayOfWeek === undefined || !slot) {
      return NextResponse.json(
        { error: 'weekStart, dayOfWeek, and slot are required' },
        { status: 400 }
      )
    }

    await prisma.mealPlan.deleteMany({
      where: { weekStart, dayOfWeek, slot },
    })

    return NextResponse.json({ deleted: true })
  } catch (err) {
    console.error('[DELETE /api/meal-plan]', err)
    return NextResponse.json({ error: 'Failed to remove meal plan entry' }, { status: 500 })
  }
}
