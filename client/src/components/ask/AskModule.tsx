import React, { useState, useRef, useEffect } from 'react';
import { streamSSE } from '../../api';
import { Btn, Spinner } from '../shared/FormFields';

interface Theme { accent: string; accentDim: string; glass: string }

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AskModule({ theme }: { theme: Theme }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setError('');

    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setLoading(true);

    const abortController = new AbortController();
    abortRef.current = abortController;

    let assistantText = '';
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      await streamSSE(
        '/ask',
        { messages: newMessages.map(m => ({ role: m.role, content: m.content })) },
        (chunk) => {
          assistantText += chunk;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: assistantText };
            return updated;
          });
        },
        abortController.signal
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        setMessages(prev => {
          const updated = [...prev];
          if (updated[updated.length - 1]?.role === 'assistant' && !updated[updated.length - 1].content) {
            updated.pop();
          }
          return updated;
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
        <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 22 }}>💬 Ask RR</h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>Your homestead AI assistant — has full context of your garden, projects, meals, and more.</p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 20px 0' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌿</div>
            <p style={{ fontSize: 15 }}>Ask anything about Rattlesnake Ridge.</p>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              {[
                'What should I water today?',
                'Help me plan dinner for this week',
                "What's Kyle's next step on the shop?",
                'Best time to plant herbs in West Texas?',
              ].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion); }}
                  style={{
                    padding: '8px 16px', borderRadius: 20, fontSize: 13,
                    background: theme.accentDim, color: theme.accent,
                    border: `1px solid ${theme.accent}33`,
                    cursor: 'pointer', fontFamily: 'Lora, Georgia, serif',
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{
              maxWidth: '80%',
              padding: '10px 16px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user' ? theme.accentDim : 'rgba(255,255,255,0.07)',
              border: msg.role === 'user' ? `1px solid ${theme.accent}44` : '1px solid rgba(255,255,255,0.1)',
              fontSize: 14, lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
              color: msg.role === 'user' ? theme.accent : '#f0ead6',
            }}>
              {msg.content || (loading && i === messages.length - 1 ? <span style={{ animation: 'pulse 1s infinite', display: 'inline-block' }}>●●●</span> : '')}
            </div>
          </div>
        ))}

        {error && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(255,50,50,0.1)', borderRadius: 10, color: '#fca5a5', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Error: {error}</span>
            <Btn onClick={send} variant="ghost" style={{ fontSize: 12 }}>Retry</Btn>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about Rattlesnake Ridge..."
            disabled={loading}
            style={{
              flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
              color: '#f0ead6', fontSize: 14, fontFamily: 'Lora, Georgia, serif',
              resize: 'none', minHeight: 44, maxHeight: 120, outline: 'none',
            }}
            rows={1}
          />
          <Btn
            onClick={send}
            disabled={loading || !input.trim()}
            accent={theme.accent}
            style={{ padding: '10px 20px', borderRadius: 12, flexShrink: 0 }}
          >
            {loading ? <Spinner size={16} color="#fff" /> : '→'}
          </Btn>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>Enter to send · Shift+Enter for newline</p>
      </div>
    </div>
  );
}
