'use client'

import { useState, useRef, useEffect, FormEvent } from 'react'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import type { ChatMessage, Recipe, WeekPlan } from '@/types'

interface KitchenAssistantProps {
  recipes: Recipe[]
  weekPlan: WeekPlan
  weekStart: string
}

export function KitchenAssistant({ recipes, weekPlan }: KitchenAssistantProps) {
  const [open,     setOpen]     = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input,    setInput]    = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const sendMessage = async (e?: FormEvent) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text || streaming) return

    const newUserMsg: ChatMessage = { role: 'user', content: text }
    const updatedMessages = [...messages, newUserMsg]

    setMessages(updatedMessages)
    setInput('')
    setStreaming(true)
    setError(null)

    // Placeholder for streaming assistant response
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          context: {
            recipes: recipes.map(r => ({
              id: r.id,
              name: r.name,
              category: r.category,
              cuisine: r.cuisine,
              emoji: r.emoji,
            })),
            weekPlan,
          },
        }),
      })

      if (!res.ok || !res.body) {
        throw new Error(`Server error ${res.status}`)
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let   buffer  = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') break

          try {
            const parsed = JSON.parse(raw)
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.text) {
              setMessages(prev => {
                const copy = [...prev]
                const last = copy[copy.length - 1]
                if (last?.role === 'assistant') {
                  copy[copy.length - 1] = {
                    ...last,
                    content: last.content + parsed.text,
                  }
                }
                return copy
              })
            }
          } catch (parseErr) {
            // Skip malformed SSE lines
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Kitchen Assistant.')
      // Remove the empty placeholder message
      setMessages(prev => {
        const copy = [...prev]
        if (copy[copy.length - 1]?.role === 'assistant' && !copy[copy.length - 1].content) {
          copy.pop()
        }
        return copy
      })
    } finally {
      setStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="mt-6 border border-gold/30 rounded-2xl overflow-hidden shadow-warm">
      {/* Toggle header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-cream hover:bg-gold/20 transition-colors duration-150"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤠</span>
          <div className="text-left">
            <p className="font-display text-base text-brown">Kitchen Assistant</p>
            <p className="font-body text-xs text-brown/60">
              Ask about recipes, plan the week, or get cooking advice
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gold transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <div className="border-t border-gold/30 flex flex-col" style={{ height: '420px' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-parchment">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <span className="text-3xl mb-3">🌾</span>
                <p className="font-display text-base text-brown mb-1">Howdy, Sarah & Kyle!</p>
                <p className="font-body text-sm text-brown/60 max-w-xs leading-relaxed">
                  Ask me about your recipes, what to make this week, or any cooking question.
                </p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`chat-message flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-saddle flex items-center justify-center flex-shrink-0 mr-2.5 mt-0.5">
                      <span className="text-xs text-parchment">🤠</span>
                    </div>
                  )}
                  <div
                    className={[
                      'max-w-[75%] px-4 py-3 rounded-2xl font-body text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-saddle text-parchment rounded-tr-sm'
                        : 'bg-cream border border-gold/40 text-brown rounded-tl-sm shadow-warm',
                    ].join(' ')}
                  >
                    {msg.content || (
                      <span className="flex items-center gap-2 text-brown/50">
                        <Spinner size="sm" />
                        <span>Thinking…</span>
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-body">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-gold/30 px-4 py-3 bg-cream">
            <form onSubmit={sendMessage} className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about recipes or the week's plan… (Enter to send)"
                rows={2}
                disabled={streaming}
                className="flex-1 px-3 py-2.5 bg-parchment border border-gold/50 rounded-xl text-sm text-brown font-body placeholder-brown/40 focus:outline-none focus:ring-2 focus:ring-saddle/40 resize-none disabled:opacity-60"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={streaming}
                disabled={!input.trim()}
                className="self-end flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </Button>
            </form>
            <p className="mt-1.5 text-[10px] text-brown/40 font-body text-right">
              Shift+Enter for new line · Enter to send
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
