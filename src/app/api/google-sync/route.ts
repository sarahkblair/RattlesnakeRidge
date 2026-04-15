import { NextResponse } from 'next/server'
import { syncFromGoogleDoc } from '@/lib/google-docs'
import { prisma } from '@/lib/prisma'

// ── POST /api/google-sync — pull recipes from Google Doc → SQLite ──
export async function POST() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS || !process.env.GOOGLE_DOC_ID) {
    return NextResponse.json(
      { error: 'Google credentials not configured. Set GOOGLE_APPLICATION_CREDENTIALS and GOOGLE_DOC_ID in .env' },
      { status: 503 }
    )
  }

  try {
    const parsed = await syncFromGoogleDoc()

    let synced = 0
    const errors: string[] = []

    for (const recipe of parsed) {
      try {
        await prisma.recipe.upsert({
          where: { name: recipe.name },
          update: {
            category: recipe.category,
            cuisine:  recipe.cuisine,
            ingredients: recipe.ingredients.join('\n'),
            steps:       recipe.steps.join('\n'),
            source: 'google',
          },
          create: {
            name:        recipe.name,
            category:    recipe.category,
            cuisine:     recipe.cuisine,
            emoji:       '🍽️',
            ingredients: recipe.ingredients.join('\n'),
            steps:       recipe.steps.join('\n'),
            source:      'google',
          },
        })
        synced++
      } catch (err) {
        errors.push(`"${recipe.name}": ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    return NextResponse.json({ synced, total: parsed.length, errors })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST /api/google-sync]', err)
    return NextResponse.json(
      { error: `Failed to reach Google Doc: ${msg}` },
      { status: 503 }
    )
  }
}
