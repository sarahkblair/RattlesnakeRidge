import Anthropic from '@anthropic-ai/sdk'

// Singleton to avoid re-creating the client on every hot-reload in dev
const globalForAnthropic = globalThis as unknown as {
  anthropic: Anthropic | undefined
}

export const anthropic: Anthropic =
  globalForAnthropic.anthropic ??
  new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForAnthropic.anthropic = anthropic
}
