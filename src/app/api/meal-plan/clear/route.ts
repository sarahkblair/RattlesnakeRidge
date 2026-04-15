import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ── DELETE /api/meal-plan/clear?weekStart=YYYY-MM-DD ──────────
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const weekStart = searchParams.get('weekStart')

  if (!weekStart) {
    return NextResponse.json({ error: 'weekStart query param required' }, { status: 400 })
  }

  try {
    const { count } = await prisma.mealPlan.deleteMany({
      where: { weekStart },
    })
    return NextResponse.json({ deleted: count })
  } catch (err) {
    console.error('[DELETE /api/meal-plan/clear]', err)
    return NextResponse.json({ error: 'Failed to clear week' }, { status: 500 })
  }
}
