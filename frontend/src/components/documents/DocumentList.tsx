import { useEffect, useState, useCallback } from 'react'
import { FileText, Loader2, CheckCircle, AlertCircle, Trash2 } from 'lucide-react'
import type { Document } from '../../types'
import { apiFetch } from '../../lib/api'
import { Badge } from '../ui/Badge'

interface Props {
  projectId: string
  refreshKey: number
}

const statusVariant: Record<Document['status'], 'default' | 'info' | 'success' | 'error' | 'warning'> = {
  uploading: 'info',
  processing: 'warning',
  ready: 'success',
  error: 'error',
}

const statusIcon = {
  uploading: <Loader2 size={14} className="animate-spin text-blue-500" />,
  processing: <Loader2 size={14} className="animate-spin text-yellow-500" />,
  ready: <CheckCircle size={14} className="text-green-500" />,
  error: <AlertCircle size={14} className="text-red-500" />,
}

export function DocumentList({ projectId, refreshKey }: Props) {
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDocs = useCallback(async () => {
    const data = await apiFetch(`/projects/${projectId}/documents`)
    setDocs(data)
    setLoading(false)
  }, [projectId])

  useEffect(() => { fetchDocs() }, [fetchDocs, refreshKey])

  // Poll while any doc is not ready
  useEffect(() => {
    const pending = docs.some(d => d.status === 'uploading' || d.status === 'processing')
    if (!pending) return
    const t = setInterval(fetchDocs, 3000)
    return () => clearInterval(t)
  }, [docs, fetchDocs])

  const deleteDoc = async (id: string) => {
    await apiFetch(`/projects/${projectId}/documents/${id}`, { method: 'DELETE' })
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  if (loading) return <div className="text-sm text-slate-400 py-4">Loading documents...</div>
  if (!docs.length) return <div className="text-sm text-slate-400 py-4">No documents yet. Upload one above.</div>

  return (
    <div className="space-y-2">
      {docs.map(doc => (
        <div key={doc.id} className="flex items-center gap-3 bg-white border border-slate-100 rounded-lg px-4 py-3">
          <FileText size={16} className="text-slate-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">{doc.name}</p>
            <p className="text-xs text-slate-400">{formatSize(doc.size_bytes)}</p>
          </div>
          <div className="flex items-center gap-2">
            {statusIcon[doc.status]}
            <Badge variant={statusVariant[doc.status]}>{doc.status}</Badge>
            <button
              onClick={() => deleteDoc(doc.id)}
              className="text-slate-300 hover:text-red-400 transition-colors ml-1"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
