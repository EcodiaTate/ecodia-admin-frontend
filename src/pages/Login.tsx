import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await axios.post('/api/auth/login', { password })
      login(data.token, data.refreshToken)
      navigate('/dashboard')
    } catch {
      toast.error('Invalid password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-950">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6 rounded-lg border border-zinc-800 bg-zinc-900 p-8">
        <h1 className="text-2xl font-semibold text-zinc-100">Ecodia Admin</h1>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full rounded-md bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
