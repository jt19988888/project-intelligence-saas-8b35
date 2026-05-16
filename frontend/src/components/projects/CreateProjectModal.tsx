import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input, Textarea } from '../ui/Input'

interface Props {
  open: boolean
  onClose: () => void
  onCreate: (name: string, description: string) => Promise<void>
}

export function CreateProjectModal({ open, onClose, onCreate }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      await onCreate(name.trim(), description.trim())
      setName('')
      setDescription('')
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New project">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project name"
          placeholder="e.g. Q3 Infrastructure Plan"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          autoFocus
        />
        <Textarea
          label="Description (optional)"
          placeholder="What is this project about?"
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create project</Button>
        </div>
      </form>
    </Modal>
  )
}
