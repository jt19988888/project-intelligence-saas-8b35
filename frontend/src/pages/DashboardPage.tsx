import { useState } from 'react'
import { Plus, FolderOpen } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { ProjectCard } from '../components/projects/ProjectCard'
import { CreateProjectModal } from '../components/projects/CreateProjectModal'
import { useProjects } from '../hooks/useProjects'

export function DashboardPage() {
  const { projects, loading, createProject } = useProjects()
  const [modalOpen, setModalOpen] = useState(false)

  const handleCreate = async (name: string, description: string) => {
    await createProject(name, description)
    setModalOpen(false)
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {projects.length} project{projects.length !== 1 ? 's' : ''} · upload documents and ask questions
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} className="mr-1.5" />
          New project
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 h-32 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <FolderOpen size={36} className="text-slate-300 mx-auto mb-3" />
          <h2 className="text-sm font-semibold text-slate-600 mb-1">No projects yet</h2>
          <p className="text-xs text-slate-400 mb-4">Create your first project to start uploading documents.</p>
          <Button onClick={() => setModalOpen(true)} size="sm">
            <Plus size={14} className="mr-1" />
            Create project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}

      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}
