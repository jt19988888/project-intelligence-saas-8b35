export interface Project {
  id: string
  name: string
  description: string | null
  created_by: string
  created_at: string
  updated_at: string
  member_count?: number
  document_count?: number
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: 'admin' | 'editor' | 'viewer'
  created_at: string
  user_email?: string
}

export interface Document {
  id: string
  project_id: string
  name: string
  file_path: string
  file_type: string
  size_bytes: number
  status: 'uploading' | 'processing' | 'ready' | 'error'
  uploaded_by: string
  created_at: string
}

export interface ChatSession {
  id: string
  project_id: string
  user_id: string
  title: string | null
  created_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  sources?: DocumentSource[]
  created_at: string
}

export interface DocumentSource {
  document_id: string
  document_name: string
  chunk: string
}
