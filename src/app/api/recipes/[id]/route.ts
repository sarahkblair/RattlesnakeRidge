import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

// ── GET /api/recipes/[id] ─────────────────────────────────────
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const row = await prisma.recipe.findUnique({ where: { id } })
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(serializeRecipe(row))
}

// ── PUT /api/recipes/[id] ─────────────────────────────────────
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  try {
    const body = await req.json()
    const { name, category, cuisine, emoji, ingredients, steps } = body

    const row = await prisma.recipe.update({
      where: { id },
      data: {
        ...(name      && { name: name.trim() }),
        ...(category  && { category: category.trim() }),
        ...(cuisine   && { cuisine: cuisine.trim() }),
        ...(emoji     && { emoji: emoji.trim() }),
        ...(Array.isArray(ingredients) && {
          ingredients: ingredients.filter(Boolean).join('\n'),
        }),
        ...(Array.isArray(steps) && {
          steps: steps.filter(Boolean).join('\n'),
        }),
      },
    })

    return NextResponse.json(serializeRecipe(row))
  } catch (err) {
    console.error('[PUT /api/recipes/[id]]', err)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

// ── DELETE /api/recipes/[id] ──────────────────────────────────
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  try {
    await prisma.recipe.delete({ where: { id } })
    return NextResponse.json({ deleted: true })
  } catch (err) {
    console.error('[DELETE /api/recipes/[id]]', err)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
