import { useNavigate } from 'react-router-dom'
import type { Project } from '../../types'
import { FileText, Users, ArrowRight } from 'lucide-react'

interface Props { project: Project }

export function ProjectCard({ project }: Props) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(`/projects/${project.id}`)}
      className="bg-white rounded-xl border border-slate-200 p-5 text-left hover:shadow-md hover:border-blue-200 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
          <FileText size={18} className="text-blue-600" />
        </div>
        <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
      </div>
      <h3 className="font-semibold text-slate-900 mb-1 text-sm">{project.name}</h3>
      {project.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{project.description}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <FileText size={12} />
          {project.document_count ?? 0} docs
        </span>
        <span className="flex items-center gap-1">
          <Users size={12} />
          {project.member_count ?? 1} member{(project.member_count ?? 1) !== 1 ? 's' : ''}
        </span>
      </div>
    </button>
  )
}
