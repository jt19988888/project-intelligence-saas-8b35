import { useState, useRef, useEffect, useCallback } from 'react'
import type { ChatMessage as ChatMsg, DocumentSource } from '../../types'
import { apiStream, apiFetch } from '../../lib/api'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { Brain } from 'lucide-react'

interface Props {
  projectId: string
  sessionId: string | null
  onSessionCreated: (id: string) => void
}

export function ChatInterface({ projectId, sessionId, onSessionCreated }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadMessages = useCallback(async (sid: string) => {
    const data = await apiFetch(`/chat/sessions/${sid}/messages`)
    setMessages(data)
  }, [])

  useEffect(() => {
    if (sessionId) loadMessages(sessionId)
    else setMessages([])
  }, [sessionId, loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (content: string) => {
    if (streaming) return
    setStreaming(true)

    let sid = sessionId
    if (!sid) {
      const session = await apiFetch(`/chat/sessions`, {
        method: 'POST',
        body: JSON.stringify({ project_id: projectId, title: content.slice(0, 60) }),
      })
      sid = session.id
      onSessionCreated(session.id)
    }

    const userMsg: ChatMsg = {
      id: crypto.randomUUID(),
      session_id: sid!,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])

    const assistantMsg: ChatMsg = {
      id: crypto.randomUUID(),
      session_id: sid!,
      role: 'assistant',
      content: '',
      sources: [],
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, assistantMsg])

    await apiStream(
      `/chat/sessions/${sid}/messages`,
      { content, project_id: projectId },
      (text) => {
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id ? { ...m, content: m.content + text } : m
        ))
      },
      (sources) => {
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id ? { ...m, sources: sources as DocumentSource[] } : m
        ))
        setStreaming(false)
      }
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <Brain size={22} className="text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700 mb-1">Ask about your documents</h3>
            <p className="text-xs text-slate-400 max-w-xs">
              Upload documents and ask questions — I'll find answers using the project's content.
            </p>
          </div>
        )}
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={sendMessage} disabled={streaming} />
    </div>
  )
}
