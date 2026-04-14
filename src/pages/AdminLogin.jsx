import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OddballLogo from '../components/OddballLogo'
import { TEAL } from '../lib/theme'

export default function AdminLogin() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    const correctPin = import.meta.env.VITE_ADMIN_PIN || '1234'
    if (pin === correctPin) {
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
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm px-10 py-8 w-full max-w-sm">
          <p className="text-base font-semibold text-gray-900 mb-1">Enter your PIN</p>
          <p className="text-sm text-gray-400 mb-6">Access is restricted to authorized staff.</p>

          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={e => { setPin(e.target.value); setError(false) }}
            placeholder="••••"
            className={`w-full px-4 py-4 text-2xl text-center tracking-[0.5em] border-2 rounded-xl focus:outline-none transition-colors mb-4 ${
              error ? 'border-red-300 bg-red-50' : 'border-gray-200'
            }`}
            style={!error ? { '--focus-color': TEAL } : {}}
            onFocus={e => { if (!error) e.target.style.borderColor = TEAL }}
            onBlur={e => { if (!error) e.target.style.borderColor = '#e5e7eb' }}
            autoFocus
          />

          {error && (
            <p className="text-red-500 text-sm text-center mb-4">Incorrect PIN. Try again.</p>
          )}

          <button
            type="submit"
            className="w-full py-3 text-white font-semibold rounded-full transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: TEAL }}
          >
            Enter
          </button>
        </form>

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
