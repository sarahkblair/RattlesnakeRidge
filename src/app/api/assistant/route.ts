import { anthropic } from '@/lib/anthropic'
import type { AssistantRequestBody } from '@/types'
import { DAY_NAMES } from '@/types'

export const runtime = 'nodejs'

const SYSTEM_PROMPT = `You are a warm, practical homestead cooking companion for Sarah and Kyle at Rattlesnake Ridge — 44 acres in West Texas. They eat one main meal a day and also bake, preserve, and ferment on the side. Be direct, specific, and concise.`

function buildWeekSummary(
  weekPlan: AssistantRequestBody['context']['weekPlan']
): string {
  const days: string[] = []

  for (let d = 0; d < 7; d++) {
    const mainEntry = weekPlan.find(e => e.dayOfWeek === d && e.slot === 'main')
    const alsoEntry = weekPlan.find(e => e.dayOfWeek === d && e.slot === 'also')

    const mainLabel = mainEntry?.recipe?.name ?? '(nothing planned)'
    const alsoLabel = alsoEntry?.recipe?.name

    let line = `${DAY_NAMES[d]}: Main — ${mainLabel}`
    if (alsoLabel) line += ` | Also Making — ${alsoLabel}`
    days.push(line)
  }

  return days.join('\n')
}

// ── POST /api/assistant — stream SSE chat response ────────────
export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body: AssistantRequestBody = await req.json()
    const { messages, context } = body

    // Build rich context strings
    const vaultSummary = context.recipes.length > 0
      ? context.recipes
          .map(r => `${r.emoji} ${r.name} (${r.category} · ${r.cuisine})`)
          .join('\n')
      : '(no recipes in vault yet)'

    const weekSummary = buildWeekSummary(context.weekPlan)

    const systemWithContext = `${SYSTEM_PROMPT}

## Recipe Vault (${context.recipes.length} recipes)
${vaultSummary}

## This Week's Plan
${weekSummary}`

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const anthropicStream = anthropic.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: systemWithContext,
            messages: messages.map(m => ({
              role: m.role,
              content: m.content,
            })),
          })

          for await (const event of anthropicStream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const chunk = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`
              controller.enqueue(encoder.encode(chunk))
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err)
          const chunk = `data: ${JSON.stringify({ error: errMsg })}\n\n`
          controller.enqueue(encoder.encode(chunk))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    console.error('[POST /api/assistant]', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
