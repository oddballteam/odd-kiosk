import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import OddballLogo from '../components/OddballLogo'
import { TEAL } from '../lib/theme'

const KEYS = [
  ['1','2','3'],
  ['4','5','6'],
  ['7','8','9'],
  ['⌫','0','→'],
]

export default function AdminLogin() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const navigate = useNavigate()

  const handleKey = (key) => {
    if (key === '⌫') {
      setPin(p => p.slice(0, -1))
      setError(false)
    } else if (key === '→') {
      submit(pin)
    } else {
      const next = pin + key
      setPin(next)
      setError(false)
    }
  }

  const submit = (value) => {
    const correctPin = import.meta.env.VITE_ADMIN_PIN || '1234'
    if (value === correctPin) {
      sessionStorage.setItem('admin_auth', '1')
      navigate('/admin')
    } else {
      setError(true)
      setPin('')
    }
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Teal top */}
      <div className="flex-[2] flex flex-col items-center justify-center text-white px-8 pb-6" style={{ backgroundColor: TEAL }}>
        <OddballLogo size={80} />
        <h1 className="mt-5 text-3xl font-light tracking-wide">Oddball Admin</h1>
        <p className="mt-2 text-sm opacity-70">Receptionist & HR access</p>
      </div>

      {/* Light bottom */}
      <div className="flex-[3] bg-gray-100 flex flex-col items-center justify-center px-8">
        <div className="bg-white rounded-2xl shadow-sm px-10 py-8 w-full max-w-sm">
          <p className="text-base font-semibold text-gray-900 mb-1">Enter your PIN</p>
          <p className="text-sm text-gray-400 mb-6">Access is restricted to authorized staff.</p>

          {/* PIN display */}
          <div className={`w-full px-4 py-4 text-2xl text-center tracking-[0.5em] border-2 rounded-xl mb-2 ${
            error ? 'border-red-300 bg-red-50 text-red-400' : 'border-gray-200 text-gray-800'
          }`}>
            {pin.length ? '•'.repeat(pin.length) : <span className="text-gray-300">••••</span>}
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center mb-3">Incorrect PIN. Try again.</p>
          )}

          {/* Number pad */}
          <div className="mt-4 space-y-2">
            {KEYS.map((row, r) => (
              <div key={r} className="flex gap-2">
                {row.map(k => (
                  <button
                    key={k}
                    type="button"
                    onMouseDown={e => { e.preventDefault(); handleKey(k) }}
                    className="flex-1 h-14 rounded-xl text-xl font-bold text-white active:scale-95 transition-all hover:opacity-90"
                    style={{
                      backgroundColor: k === '→' ? TEAL : k === '⌫' ? '#e05a5a' : '#9ca3af'
                    }}
                  >
                    {k}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Back to Kiosk
        </button>
      </div>
    </div>
  )
}
