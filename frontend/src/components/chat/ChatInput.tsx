import { useState } from 'react'
import { Send } from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  onSend: (content: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('')

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-slate-100 p-4">
      <div className="flex items-end gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask a question about your documents..."
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none text-sm text-slate-700 placeholder:text-slate-400 outline-none bg-transparent max-h-32 overflow-y-auto"
          style={{ height: 'auto' }}
          onInput={e => {
            const el = e.currentTarget
            el.style.height = 'auto'
            el.style.height = `${el.scrollHeight}px`
          }}
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className={clsx(
            'w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0',
            value.trim() && !disabled
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          )}
        >
          <Send size={15} />
        </button>
      </div>
      <p className="text-xs text-slate-400 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
    </div>
  )
}
