import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Files } from 'lucide-react'
import type { Project, ChatSession } from '../types'
import { apiFetch } from '../lib/api'
import { DocumentUpload } from '../components/documents/DocumentUpload'
import { DocumentList } from '../components/documents/DocumentList'
import { ChatInterface } from '../components/chat/ChatInterface'
import { clsx } from 'clsx'

type Tab = 'chat' | 'documents'

export function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [tab, setTab] = useState<Tab>('chat')
  const [refreshKey, setRefreshKey] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])

  useEffect(() => {
    if (!id) return
    apiFetch(`/projects/${id}`).then(setProject)
    apiFetch(`/chat/sessions?project_id=${id}`).then(setSessions)
  }, [id])

  if (!project || !id) {
    return <div className="p-8 text-sm text-slate-400">Loading...</div>
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4 shrink-0">
        <Link to="/" className="text-slate-400 hover:text-slate-700">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-slate-900 truncate">{project.name}</h1>
          {project.description && (
            <p className="text-xs text-slate-400 truncate">{project.description}</p>
          )}
        </div>
        <nav className="flex gap-1">
          {([['chat', 'Chat', MessageSquare], ['documents', 'Documents', Files]] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                tab === key ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === 'chat' ? (
          <div className="flex h-full">
            {/* Session sidebar */}
            <div className="w-52 border-r border-slate-100 bg-slate-50 flex flex-col shrink-0">
              <div className="px-3 py-3 border-b border-slate-100">
                <button
                  onClick={() => setSessionId(null)}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  + New conversation
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                {sessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSessionId(s.id)}
                    className={clsx(
                      'w-full text-left px-4 py-2 text-xs transition-colors',
                      sessionId === s.id ? 'bg-white text-slate-900 font-medium' : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    <span className="line-clamp-2">{s.title ?? 'Untitled conversation'}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatInterface
                projectId={id}
                sessionId={sessionId}
                onSessionCreated={(sid) => {
                  setSessionId(sid)
                  apiFetch(`/chat/sessions?project_id=${id}`).then(setSessions)
                }}
              />
            </div>
          </div>
        ) : (
          <div className="p-6 max-w-2xl space-y-6 overflow-y-auto h-full">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Upload documents</h2>
              <DocumentUpload
                projectId={id}
                onUploaded={() => setRefreshKey(k => k + 1)}
              />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Project documents</h2>
              <DocumentList projectId={id} refreshKey={refreshKey} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
