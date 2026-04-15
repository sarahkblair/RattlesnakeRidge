import { google } from 'googleapis'
import type { docs_v1 } from 'googleapis'

// ── Types ─────────────────────────────────────────────────────

export interface ParsedRecipe {
  name: string
  category: string
  cuisine: string
  ingredients: string[]
  steps: string[]
}

// ── Auth ──────────────────────────────────────────────────────

function getDocsAuth() {
  return new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/documents'],
  })
}

// ── Paragraph helpers ─────────────────────────────────────────

function extractPlainText(para: docs_v1.Schema$Paragraph): string {
  return (para.elements ?? [])
    .map(el => el.textRun?.content ?? '')
    .join('')
    .replace(/\n$/, '')
    .trim()
}

function isAllBold(para: docs_v1.Schema$Paragraph): boolean {
  const elements = para.elements ?? []
  if (elements.length === 0) return false
  return elements.every(el => {
    const content = el.textRun?.content ?? ''
    if (!content.trim()) return true  // ignore whitespace-only runs
    return el.textRun?.textStyle?.bold === true
  })
}

function hasBullet(para: docs_v1.Schema$Paragraph): boolean {
  return !!para.bullet
}

type ListMap = Record<string, docs_v1.Schema$List>

function getGlyphType(para: docs_v1.Schema$Paragraph, lists: ListMap): string | null {
  if (!para.bullet?.listId) return null
  const list = lists[para.bullet.listId]
  return list?.listProperties?.nestingLevels?.[0]?.glyphType ?? null
}

function isBulletList(para: docs_v1.Schema$Paragraph, lists: ListMap): boolean {
  const glyph = getGlyphType(para, lists)
  return !glyph || glyph === 'GLYPH_TYPE_UNSPECIFIED'
}

function isNumberedList(para: docs_v1.Schema$Paragraph, lists: ListMap): boolean {
  const glyph = getGlyphType(para, lists)
  if (!glyph) return false
  return ['DECIMAL', 'ALPHA', 'ROMAN', 'UPPER_ALPHA', 'UPPER_ROMAN'].includes(glyph)
}

// ── Sync: read from Google Doc → return parsed recipes ────────

export async function syncFromGoogleDoc(): Promise<ParsedRecipe[]> {
  const auth = getDocsAuth()
  const docsClient = google.docs({ version: 'v1', auth })

  const response = await docsClient.documents.get({
    documentId: process.env.GOOGLE_DOC_ID!,
  })

  const doc = response.data
  const content = doc.body?.content ?? []
  const lists = (doc.lists ?? {}) as ListMap

  // Collect non-empty paragraphs
  const paragraphs = content
    .filter(el => !!el.paragraph)
    .map(el => el.paragraph!)
    .filter(p => extractPlainText(p) !== '')

  const recipes: ParsedRecipe[] = []

  type State = 'idle' | 'category' | 'cuisine' | 'ingredients' | 'steps'
  let state: State = 'idle'
  let current: {
    name: string
    category: string
    cuisine: string
    ingredients: string[]
    steps: string[]
  } | null = null

  const flush = () => {
    if (current?.name && current.category && current.cuisine) {
      recipes.push({ ...current })
    }
    current = null
    state = 'idle'
  }

  for (const para of paragraphs) {
    const text = extractPlainText(para)
    if (!text) continue

    const bold   = isAllBold(para)
    const bullet = hasBullet(para)
    const numbered = bullet && isNumberedList(para, lists)
    const isBullet = bullet && isBulletList(para, lists)

    // A bold non-bullet paragraph always starts a new recipe
    if (bold && !bullet) {
      flush()
      current = { name: text, category: '', cuisine: '', ingredients: [], steps: [] }
      state = 'category'
      continue
    }

    if (!current) continue

    switch (state) {
      case 'category':
        current.category = text
        state = 'cuisine'
        break

      case 'cuisine':
        current.cuisine = text
        state = 'ingredients'
        break

      case 'ingredients':
        if (isBullet) {
          current.ingredients.push(text)
        } else if (numbered) {
          current.steps.push(text)
          state = 'steps'
        }
        break

      case 'steps':
        if (numbered) {
          current.steps.push(text)
        } else {
          // Anything non-numbered ends the steps section
          flush()
        }
        break
    }
  }

  flush()  // save the last recipe
  return recipes
}

// ── Write-back: append a new recipe to the Google Doc ─────────

export async function appendRecipeToGoogleDoc(recipe: {
  name: string
  category: string
  cuisine: string
  ingredients: string[]
  steps: string[]
}): Promise<void> {
  try {
    const auth = getDocsAuth()
    const docsClient = google.docs({ version: 'v1', auth })

    // Fetch the current document to find the end insertion point
    const { data: doc } = await docsClient.documents.get({
      documentId: process.env.GOOGLE_DOC_ID!,
    })

    const content = doc.body?.content ?? []
    const lastEl = content[content.length - 1]
    // Insert before the document's final newline
    const insertAt = (lastEl?.endIndex ?? 1) - 1

    let idx = insertAt
    const requests: docs_v1.Schema$Request[] = []

    const ins = (text: string) => {
      requests.push({
        insertText: {
          location: { index: idx },
          text,
        },
      })
      idx += text.length
    }

    // ── 1. Blank separator line
    ins('\n\n')

    // ── 2. Recipe name (will bold below)
    const nameStart = idx
    ins(recipe.name + '\n')
    const nameEnd = nameStart + recipe.name.length  // exclusive of \n

    // ── 3. Category
    ins(recipe.category + '\n')

    // ── 4. Cuisine
    ins(recipe.cuisine + '\n')

    // ── 5. Ingredients
    const ingredStart = idx
    for (const ing of recipe.ingredients) {
      ins(ing + '\n')
    }
    const ingredEnd = idx

    // ── 6. Steps
    const stepsStart = idx
    for (const step of recipe.steps) {
      ins(step + '\n')
    }
    const stepsEnd = idx

    // ── 7. Bold the recipe name
    if (nameStart < nameEnd) {
      requests.push({
        updateTextStyle: {
          range: { startIndex: nameStart, endIndex: nameEnd },
          textStyle: { bold: true },
          fields: 'bold',
        },
      })
    }

    // ── 8. Bullet list for ingredients
    if (recipe.ingredients.length > 0) {
      requests.push({
        createParagraphBullets: {
          range: { startIndex: ingredStart, endIndex: ingredEnd },
          bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE',
        },
      })
    }

    // ── 9. Numbered list for steps
    if (recipe.steps.length > 0) {
      requests.push({
        createParagraphBullets: {
          range: { startIndex: stepsStart, endIndex: stepsEnd },
          bulletPreset: 'NUMBERED_DECIMAL_ALPHA_ROMAN',
        },
      })
    }

    await docsClient.documents.batchUpdate({
      documentId: process.env.GOOGLE_DOC_ID!,
      requestBody: { requests },
    })

    console.log(`[google-docs] Appended recipe: "${recipe.name}"`)
  } catch (err) {
    // Log but never throw — recipe is already saved to SQLite
    console.error('[google-docs] appendRecipeToGoogleDoc failed:', err)
  }
}
