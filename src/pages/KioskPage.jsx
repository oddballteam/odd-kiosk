import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import VisitorSignInForm from '../components/VisitorSignInForm'
import OddballLogo from '../components/OddballLogo'
import { TEAL } from '../lib/theme'

const VIEW = {
  HOME: 'home',
  SIGN_IN: 'sign_in',
  SIGN_OUT: 'sign_out',
  SUCCESS: 'success',
  SIGNED_OUT: 'signed_out',
}

export default function KioskPage() {
  const [view, setView] = useState(VIEW.HOME)
  const [clock, setClock] = useState(new Date())
  const [successInfo, setSuccessInfo] = useState(null)

  const [signOutQuery, setSignOutQuery] = useState('')
  const [activeVisitors, setActiveVisitors] = useState([])
  const [loadingVisitors, setLoadingVisitors] = useState(false)
  const [signingOut, setSigningOut] = useState(null)

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (view === VIEW.SUCCESS || view === VIEW.SIGNED_OUT) {
      const id = setTimeout(() => {
        setView(VIEW.HOME)
        setSuccessInfo(null)
        setSignOutQuery('')
        setActiveVisitors([])
      }, 8000)
      return () => clearTimeout(id)
    }
  }, [view])

  useEffect(() => {
    if (view !== VIEW.SIGN_OUT) return
    setLoadingVisitors(true)
    const today = format(new Date(), 'yyyy-MM-dd')
    supabase
      .from('visitor_log')
      .select('id, visitor_name, host_employee_name, time_in')
      .eq('visit_date', today)
      .is('time_out', null)
      .order('time_in')
      .then(({ data }) => {
        setActiveVisitors(data || [])
        setLoadingVisitors(false)
      })
  }, [view])

  const handleSignOut = async (visitor) => {
    setSigningOut(visitor.id)
    const { error } = await supabase
      .from('visitor_log')
      .update({ time_out: new Date().toISOString() })
      .eq('id', visitor.id)
    setSigningOut(null)
    if (!error) {
      setSuccessInfo({ visitorName: visitor.visitor_name, hostName: visitor.host_employee_name })
      setView(VIEW.SIGNED_OUT)
    }
  }

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (view === VIEW.HOME) {
    return (
      <div className="h-screen flex flex-col lg:flex-row">
        {/* Teal hero — top in portrait, left in landscape */}
        <div className="flex-[2] lg:flex-1 flex flex-col items-center justify-center text-white px-8 py-6" style={{ backgroundColor: TEAL }}>
          <OddballLogo size={90} />
          <h1 className="mt-4 text-4xl font-light tracking-wide text-center">Welcome to Oddball</h1>
          <p className="mt-2 text-base opacity-80 text-center">Please sign in to let us know you're here.</p>
        </div>

        {/* Cream action area — bottom in portrait, right in landscape */}
        <div className="flex-[3] lg:flex-1 flex flex-col items-center justify-center px-8 py-8" style={{ backgroundColor: '#f0ede7' }}>
          <div className="relative w-full max-w-sm">
            <div className="rounded-2xl shadow px-10 pt-10 pb-8 text-center" style={{ backgroundColor: '#f0ede7' }}>
              <p className="font-bold text-gray-900 text-lg">Check-in takes about 60 seconds</p>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Your information is kept confidential and used<br />only for building security purposes.
              </p>
            </div>
            <button
              onClick={() => setView(VIEW.SIGN_IN)}
              className="absolute left-1/2 -translate-x-1/2 w-5/6 py-4 rounded-full text-white font-semibold text-lg shadow-md hover:opacity-90 active:scale-[0.98] transition-all whitespace-nowrap"
              style={{ bottom: '-42px', backgroundColor: TEAL }}
            >
              Begin Check-In →
            </button>
          </div>

          <p className="mt-20 text-sm text-gray-400">
            Already signed in today?{' '}
            <button
              onClick={() => setView(VIEW.SIGN_OUT)}
              className="text-gray-500 hover:text-gray-800 transition-colors"
            >
              View your record
            </button>
          </p>
        </div>
      </div>
    )
  }

  // ── SIGN-IN FORM ──────────────────────────────────────────────────────────
  if (view === VIEW.SIGN_IN) {
    return (
      <div className="h-screen flex flex-col">
        <VisitorSignInForm
          clock={clock}
          onComplete={(info) => { setSuccessInfo(info); setView(VIEW.SUCCESS) }}
          onCancel={() => setView(VIEW.HOME)}
        />
      </div>
    )
  }

  // ── SIGN-OUT ──────────────────────────────────────────────────────────────
  if (view === VIEW.SIGN_OUT) {
    return (
      <div className="h-screen flex flex-col lg:flex-row">
        {/* Teal side */}
        <div className="flex-[2] lg:flex-1 flex flex-col px-8 py-6 text-white" style={{ backgroundColor: TEAL }}>
          <div className="flex items-center gap-3 mb-6">
            <OddballLogo size={32} />
            <span className="font-semibold tracking-wide">Oddball Visitor Check-Out</span>
          </div>
          <h2 className="text-2xl font-light mb-2">Tap your name to sign out.</h2>
          <p className="text-white/60 text-sm">Showing everyone currently signed in today.</p>
          <div className="hidden lg:flex flex-col items-center justify-center flex-1 opacity-30">
            <OddballLogo size={72} />
          </div>
        </div>

        {/* Cream side */}
        <div className="flex-[3] lg:flex-1 flex flex-col px-8 py-6 overflow-y-auto" style={{ backgroundColor: '#f0ede7' }}>
          {loadingVisitors ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: TEAL, borderTopColor: 'transparent' }} />
            </div>
          ) : activeVisitors.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
              <p className="text-gray-500 font-medium">No one is currently signed in.</p>
              <p className="text-gray-400 text-sm">Check back later or see the front desk.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {activeVisitors.map(vis => (
                <li key={vis.id}>
                  <button
                    onClick={() => handleSignOut(vis)}
                    disabled={signingOut === vis.id}
                    className="w-full flex items-center justify-between gap-4 rounded-xl px-5 py-4 text-left transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={{ backgroundColor: '#e8e4de' }}
                  >
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">{vis.visitor_name}</p>
                      <p className="text-sm text-gray-400">
                        Visiting {vis.host_employee_name} · In at {format(new Date(vis.time_in), 'h:mm a')}
                      </p>
                    </div>
                    <div className="text-white text-sm font-semibold px-4 py-2 rounded-lg flex-shrink-0" style={{ backgroundColor: TEAL }}>
                      {signingOut === vis.id ? '...' : 'Sign Out'}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={() => setView(VIEW.HOME)}
            className="mt-6 py-3 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors text-center"
          >
            ← Back to home
          </button>
        </div>
      </div>
    )
  }

  // ── SUCCESS ───────────────────────────────────────────────────────────────
  if (view === VIEW.SUCCESS && successInfo) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-white" style={{ backgroundColor: TEAL }}>
        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-8 ring-4 ring-white/30">
          <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-5xl font-light mb-3">You're checked in!</h2>
        <p className="text-xl opacity-80 mb-1">
          Welcome, <span className="font-semibold opacity-100">{successInfo.visitorName}</span>.
        </p>
        <p className="opacity-70 text-lg">
          Someone will be right with you to see <span className="font-medium opacity-90">{successInfo.hostName}</span>.
        </p>
        <p className="mt-10 text-sm opacity-50 animate-pulse">Returning to home screen…</p>
      </div>
    )
  }

  // ── SIGNED OUT ────────────────────────────────────────────────────────────
  if (view === VIEW.SIGNED_OUT && successInfo) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-white" style={{ backgroundColor: TEAL }}>
        <OddballLogo size={80} />
        <h2 className="mt-8 text-5xl font-light mb-3">Safe travels!</h2>
        <p className="text-xl opacity-80">
          <span className="font-semibold opacity-100">{successInfo.visitorName}</span> has been signed out.
        </p>
        <p className="mt-2 opacity-60">Have a great rest of your day.</p>
        <p className="mt-10 text-sm opacity-50 animate-pulse">Returning to home screen…</p>
      </div>
    )
  }

  return null
}
