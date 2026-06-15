import { useState } from 'react'
import { setToken } from '../auth'
import { BRAND, ACCENT } from '../utils'

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (res.ok) {
        const { token } = await res.json()
        setToken(token)
        onLogin()
      } else {
        setError('Invalid email or password.')
      }
    } catch {
      setError('Cannot reach server. Make sure the backend is running.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(135deg, ${BRAND} 0%, #1a5276 100%)`
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '48px 44px', width: 420,
        boxShadow: '0 24px 64px rgba(10,61,98,0.35)'
      }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo.jpg" alt="Simba Media" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', marginBottom: 14 }} />
          <h1 style={{ fontSize: 20, fontWeight: 900, color: BRAND, margin: 0 }}>Simba Media Ghana</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Finance Tracker · Admin Login</p>
          <div style={{ width: 40, height: 3, background: ACCENT, borderRadius: 3, margin: '14px auto 0' }} />
        </div>

        <form onSubmit={submit}>
          <div style={{ marginBottom: 18 }}>
            <label style={lbl}>Email Address</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@simbamedia.com" required style={inp}
              onFocus={e => e.target.style.borderColor = BRAND}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={lbl}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required style={inp}
              onFocus={e => e.target.style.borderColor = BRAND}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 18 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '13px', background: BRAND, color: '#fff',
            border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 15,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            transition: 'opacity 0.2s'
          }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 28 }}>
          © {new Date().getFullYear()} Simba Media Ghana Limited
        </p>
      </div>
    </div>
  )
}

const lbl = { display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }
const inp = { width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, background: '#fafafa', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' }
