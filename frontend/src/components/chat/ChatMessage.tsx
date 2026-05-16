import type { ChatMessage as ChatMsg } from '../../types'
import { Brain, User, ChevronDown, ChevronUp } from 'lucide-react'
import { clsx } from 'clsx'
import { useState } from 'react'

export function ChatMessage({ message }: { message: ChatMsg }) {
  const isUser = message.role === 'user'
  const [showSources, setShowSources] = useState(false)

  return (
    <div className={clsx('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div className={clsx(
        'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
        isUser ? 'bg-slate-200' : 'bg-blue-600'
      )}>
        {isUser
          ? <User size={14} className="text-slate-600" />
          : <Brain size={14} className="text-white" />
        }
      </div>

      <div className={clsx('flex flex-col gap-1 max-w-[80%]', isUser ? 'items-end' : 'items-start')}>
        <div className={clsx(
          'px-4 py-3 rounded-2xl text-sm leading-relaxed',
          isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
        )}>
          {message.content || (
            <span className="inline-flex gap-1">
              <span className="animate-bounce delay-0">·</span>
              <span className="animate-bounce delay-75">·</span>
              <span className="animate-bounce delay-150">·</span>
            </span>
          )}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div>
            <button
              onClick={() => setShowSources(v => !v)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
            >
              {showSources ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {message.sources.length} source{message.sources.length > 1 ? 's' : ''}
            </button>
            {showSources && (
              <div className="mt-1 space-y-1">
                {message.sources.map((s, i) => (
                  <div key={i} className="text-xs bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                    <p className="font-medium text-slate-600 mb-0.5">{s.document_name}</p>
                    <p className="text-slate-500 line-clamp-2">{s.chunk}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
