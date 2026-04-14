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
    if (signOutQuery.trim().length < 1) { setActiveVisitors([]); return }

    const timer = setTimeout(async () => {
      setLoadingVisitors(true)
      const today = format(new Date(), 'yyyy-MM-dd')
      const { data } = await supabase
        .from('visitor_log')
        .select('id, visitor_name, host_employee_name, time_in')
        .eq('visit_date', today)
        .is('time_out', null)
        .ilike('visitor_name', `%${signOutQuery}%`)
        .order('time_in')
      setActiveVisitors(data || [])
      setLoadingVisitors(false)
    }, 250)

    return () => clearTimeout(timer)
  }, [signOutQuery, view])

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
      <div className="h-screen flex flex-col">
        {/* Top — teal hero */}
        <div className="flex-[2] flex flex-col items-center justify-center text-white px-8 pb-6" style={{ backgroundColor: TEAL }}>
          <OddballLogo size={110} />
          <h1 className="mt-6 text-5xl font-light tracking-wide">Welcome to Oddball</h1>
          <p className="mt-3 text-lg opacity-80">Please sign in to let us know you're here.</p>
        </div>

        {/* Bottom — light gray action area */}
        <div className="flex-[3] bg-gray-100 flex flex-col items-center justify-center px-8 gap-5">
          {/* Info card */}
          <div className="bg-white rounded-2xl shadow-sm px-10 py-8 max-w-md w-full text-center">
            <p className="text-lg font-semibold text-gray-900">Check-in takes about 60 seconds</p>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              Your information is kept confidential and used<br />only for building security purposes.
            </p>
          </div>

          {/* Primary CTA */}
          <button
            onClick={() => setView(VIEW.SIGN_IN)}
            className="max-w-md w-full py-4 rounded-full text-white text-lg font-semibold shadow-md transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: TEAL }}
          >
            Begin Check-In &nbsp;→
          </button>

          {/* Secondary — sign out link */}
          <p className="text-sm text-gray-400">
            Already signed in today?{' '}
            <button
              onClick={() => setView(VIEW.SIGN_OUT)}
              className="text-gray-600 underline underline-offset-2 hover:text-gray-900 transition-colors"
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
      <div className="h-screen flex flex-col bg-gray-100">
        {/* Slim teal topbar */}
        <div className="flex items-center justify-between px-8 py-4 text-white" style={{ backgroundColor: TEAL }}>
          <div className="flex items-center gap-3">
            <OddballLogo size={32} />
            <span className="font-semibold tracking-wide">Oddball Visitor Check-In</span>
          </div>
          <span className="text-white/70 text-sm tabular-nums">{format(clock, 'h:mm a · EEEE, MMMM d')}</span>
        </div>

        {/* Form card */}
        <div className="flex-1 flex items-start justify-center p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-lg w-full max-w-3xl p-10">
            <VisitorSignInForm
              onComplete={(info) => { setSuccessInfo(info); setView(VIEW.SUCCESS) }}
              onCancel={() => setView(VIEW.HOME)}
            />
          </div>
        </div>
      </div>
    )
  }

  // ── SIGN-OUT SEARCH ───────────────────────────────────────────────────────
  if (view === VIEW.SIGN_OUT) {
    return (
      <div className="h-screen flex flex-col bg-gray-100">
        <div className="flex items-center justify-between px-8 py-4 text-white" style={{ backgroundColor: TEAL }}>
          <div className="flex items-center gap-3">
            <OddballLogo size={32} />
            <span className="font-semibold tracking-wide">Oddball Visitor Check-Out</span>
          </div>
          <span className="text-white/70 text-sm tabular-nums">{format(clock, 'h:mm a · EEEE, MMMM d')}</span>
        </div>

        <div className="flex-1 flex items-start justify-center p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-lg w-full max-w-lg p-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">Sign Out</h2>
            <p className="text-gray-400 mb-6">Search for your name to sign out.</p>

            <input
              type="text"
              value={signOutQuery}
              onChange={e => setSignOutQuery(e.target.value)}
              placeholder="Start typing your name..."
              autoFocus
              className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none transition-colors mb-4"
              style={{ '--tw-ring-color': TEAL }}
              onFocus={e => e.target.style.borderColor = TEAL}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />

            {loadingVisitors && (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: TEAL, borderTopColor: 'transparent' }} />
              </div>
            )}

            {!loadingVisitors && signOutQuery.length >= 1 && activeVisitors.length === 0 && (
              <p className="text-center text-gray-400 py-4 text-sm">No active sign-ins found for "{signOutQuery}"</p>
            )}

            <ul className="space-y-2">
              {activeVisitors.map(vis => (
                <li key={vis.id} className="flex items-center justify-between gap-4 bg-gray-50 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-semibold text-gray-900">{vis.visitor_name}</p>
                    <p className="text-sm text-gray-400">
                      Visiting {vis.host_employee_name} · In at {format(new Date(vis.time_in), 'h:mm a')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSignOut(vis)}
                    disabled={signingOut === vis.id}
                    className="px-4 py-2 text-white font-semibold rounded-lg text-sm transition-opacity disabled:opacity-50 hover:opacity-90"
                    style={{ backgroundColor: TEAL }}
                  >
                    {signingOut === vis.id ? '...' : 'Sign Out'}
                  </button>
                </li>
              ))}
            </ul>

            <button
              onClick={() => setView(VIEW.HOME)}
              className="w-full mt-8 py-3 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
            >
              ← Back to home
            </button>
          </div>
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
