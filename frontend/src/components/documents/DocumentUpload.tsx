import { useState, useCallback } from 'react'
import { Upload, X, FileText } from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from '../ui/Button'
import { apiUpload } from '../../lib/api'

interface Props {
  projectId: string
  onUploaded: () => void
}

const ACCEPTED = '.pdf,.docx,.csv,.xlsx,.txt'

export function DocumentUpload({ projectId, onUploaded }: Props) {
  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name))
      const news = Array.from(incoming).filter(f => !existing.has(f.name))
      return [...prev, ...news]
    })
  }, [])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const handleUpload = async () => {
    if (!files.length) return
    setUploading(true)
    setError('')
    try {
      for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        await apiUpload(`/projects/${projectId}/documents`, fd)
      }
      setFiles([])
      onUploaded()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={clsx(
          'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
          dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
        )}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept={ACCEPTED}
          className="hidden"
          onChange={e => addFiles(e.target.files)}
        />
        <Upload size={24} className="mx-auto text-slate-400 mb-2" />
        <p className="text-sm font-medium text-slate-600">Drop files here or click to browse</p>
        <p className="text-xs text-slate-400 mt-1">PDF, DOCX, CSV, XLSX, TXT supported</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2">
              <FileText size={16} className="text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                <p className="text-xs text-slate-400">{formatSize(file.size)}</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setFiles(prev => prev.filter((_, j) => j !== i)) }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button onClick={handleUpload} loading={uploading} size="sm">
            Upload {files.length} file{files.length > 1 ? 's' : ''}
          </Button>
        </div>
      )}
    </div>
  )
}
