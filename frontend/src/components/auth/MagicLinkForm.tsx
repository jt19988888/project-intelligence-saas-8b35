import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Brain, Mail } from 'lucide-react'

export function MagicLinkForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4">
            <Brain size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Project Intelligence</h1>
          <p className="text-slate-400 mt-1 text-sm">AI-powered project planning & document analysis</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={22} className="text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Check your email</h2>
              <p className="text-sm text-slate-500">
                We sent a magic link to <strong>{email}</strong>. Click it to sign in — no password needed.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-sm text-blue-600 hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-1">Sign in</h2>
                <p className="text-sm text-slate-500">Enter your email and we'll send you a magic link.</p>
              </div>
              <Input
                type="email"
                label="Work email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                error={error}
              />
              <Button type="submit" loading={loading} size="lg" className="w-full">
                Send magic link
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
