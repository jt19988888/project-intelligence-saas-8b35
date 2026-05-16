import { useEffect, useState, useCallback } from 'react'
import type { Project } from '../types'
import { apiFetch } from '../lib/api'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiFetch('/projects')
      setProjects(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const createProject = async (name: string, description: string) => {
    const project = await apiFetch('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    })
    setProjects(prev => [project, ...prev])
    return project
  }

  return { projects, loading, error, refetch: fetchProjects, createProject }
}
