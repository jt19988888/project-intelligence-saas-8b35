import { supabase } from './supabase'

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const authH = await authHeaders()
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...authH } as Record<string, string>,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Request failed')
  }
  return res.json()
}

export async function apiUpload(path: string, formData: FormData) {
  const authH = await authHeaders()
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: authH,
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Upload failed')
  }
  return res.json()
}

export async function apiStream(
  path: string,
  body: unknown,
  onChunk: (text: string) => void,
  onDone: (sources: unknown[]) => void
) {
  const authH = await authHeaders()
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authH },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Stream request failed')

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          if (parsed.type === 'text') onChunk(parsed.text)
          if (parsed.type === 'done') onDone(parsed.sources ?? [])
        } catch {}
      }
    }
  }
}
