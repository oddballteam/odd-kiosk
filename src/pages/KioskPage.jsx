import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
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
        {/* Teal hero */}
        <div className="flex-[2] lg:flex-1 flex flex-col text-white px-12 py-8" style={{ backgroundColor: TEAL }}>
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <span className="font-semibold tracking-wide text-2xl xl:text-3xl">Oddball Visitor Check-In</span>
          </div>

          {/* Center content */}
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <h1 className="text-4xl xl:text-5xl font-light tracking-wide">Welcome to Oddball</h1>
            <p className="mt-3 text-lg xl:text-xl opacity-80">Please sign in to let us know you're here.</p>
          </div>

          {/* Clock / Admin portal button */}
          <div className="mt-auto pt-6 flex items-end justify-between">
            <button
              onClick={() => navigate('/admin/login')}
              className="text-white/50 text-lg xl:text-xl tabular-nums font-light hover:text-white/80 transition-colors"
            >
              {format(clock, 'h:mm a')}
            </button>
            <p className="text-white/50 text-lg xl:text-xl tabular-nums">{format(clock, 'EEEE, MMMM d, yyyy')}</p>
          </div>
        </div>

        {/* White action area */}
        <div className="flex-[3] lg:flex-1 flex flex-col items-center justify-center px-12 py-10" style={{ backgroundColor: '#ffffff' }}>
          <div className="relative w-full max-w-lg xl:max-w-xl">
            <div className="px-12 pt-12 pb-10 text-center">
              <p className="font-bold text-gray-900 text-xl xl:text-2xl">Check-in takes about 60 seconds</p>
              <p className="mt-3 text-base xl:text-lg text-gray-500 leading-relaxed">
                Your information is kept confidential and used<br />only for building security purposes.
              </p>
            </div>
            <button
              onClick={() => setView(VIEW.SIGN_IN)}
              className="absolute left-1/2 -translate-x-1/2 w-5/6 py-5 xl:py-6 rounded-full text-white font-semibold text-xl xl:text-2xl shadow-md hover:opacity-90 active:scale-[0.98] transition-all whitespace-nowrap"
              style={{ bottom: '-52px', backgroundColor: TEAL }}
            >
              Begin Check-In →
            </button>
          </div>

          <div className="mt-28 xl:mt-32 w-full max-w-lg xl:max-w-xl flex justify-center">
            <button
              onClick={() => setView(VIEW.SIGN_OUT)}
              className="w-5/6 py-5 xl:py-6 rounded-full font-semibold text-xl xl:text-2xl border-2 hover:opacity-80 active:scale-[0.98] transition-all whitespace-nowrap"
              style={{ borderColor: TEAL, color: TEAL }}
            >
              Begin Check-Out →
            </button>
          </div>
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
        <div className="flex-[2] lg:flex-1 flex flex-col px-10 py-8 text-white" style={{ backgroundColor: TEAL }}>
          <div className="flex items-center gap-4 mb-8">
            <span className="font-semibold tracking-wide text-2xl xl:text-3xl">Oddball Visitor Check-Out</span>
          </div>
          <h2 className="text-3xl xl:text-4xl font-light mb-3">Tap your name to sign out.</h2>
          <p className="text-white/60 text-base xl:text-lg">Showing everyone currently signed in today.</p>
          <div className="flex-1" />

          {/* Clock / Admin portal button */}
          <div className="mt-auto pt-6 hidden lg:flex items-end justify-between">
            <button
              onClick={() => navigate('/admin/login')}
              className="text-white/50 text-lg xl:text-xl tabular-nums font-light hover:text-white/80 transition-colors"
            >
              {format(clock, 'h:mm a')}
            </button>
            <p className="text-white/50 text-lg xl:text-xl tabular-nums">{format(clock, 'EEEE, MMMM d, yyyy')}</p>
          </div>
        </div>

        {/* Cream side */}
        <div className="flex-[3] lg:flex-1 flex flex-col px-10 py-8 overflow-y-auto" style={{ backgroundColor: '#ffffff' }}>
          {loadingVisitors ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: TEAL, borderTopColor: 'transparent' }} />
            </div>
          ) : activeVisitors.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
              <p className="text-gray-500 font-medium text-xl">No one is currently signed in.</p>
              <p className="text-gray-400 text-base">Check back later or see the front desk.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {activeVisitors.map(vis => (
                <li key={vis.id}>
                  <button
                    onClick={() => handleSignOut(vis)}
                    disabled={signingOut === vis.id}
                    className="w-full flex items-center justify-between gap-6 rounded-xl px-7 py-5 text-left transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={{ backgroundColor: '#f3f4f6' }}
                  >
                    <div>
                      <p className="font-semibold text-gray-900 text-xl xl:text-2xl">{vis.visitor_name}</p>
                      <p className="text-base xl:text-lg text-gray-400 mt-0.5">
                        Visiting {vis.host_employee_name} · In at {format(new Date(vis.time_in), 'h:mm a')}
                      </p>
                    </div>
                    <div className="text-white text-base xl:text-lg font-semibold px-6 py-3 rounded-xl flex-shrink-0" style={{ backgroundColor: TEAL }}>
                      {signingOut === vis.id ? '...' : 'Sign Out'}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={() => setView(VIEW.HOME)}
            className="mt-8 py-4 text-gray-400 hover:text-gray-600 text-base font-medium transition-colors text-center"
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
        <div className="w-36 h-36 bg-white/20 rounded-full flex items-center justify-center mb-10 ring-4 ring-white/30">
          <svg className="w-20 h-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-6xl xl:text-7xl font-light mb-4">You're checked in!</h2>
        <p className="text-2xl xl:text-3xl opacity-80 mb-2">
          Welcome, <span className="font-semibold opacity-100">{successInfo.visitorName}</span>.
        </p>
        <p className="opacity-70 text-xl xl:text-2xl">
          Someone will be right with you to see <span className="font-medium opacity-90">{successInfo.hostName}</span>.
        </p>
        <p className="mt-12 text-base opacity-50 animate-pulse">Returning to home screen…</p>
      </div>
    )
  }

  // ── SIGNED OUT ────────────────────────────────────────────────────────────
  if (view === VIEW.SIGNED_OUT && successInfo) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-white" style={{ backgroundColor: TEAL }}>
        <h2 className="text-6xl xl:text-7xl font-light mb-4">Safe travels!</h2>
        <p className="text-2xl xl:text-3xl opacity-80">
          <span className="font-semibold opacity-100">{successInfo.visitorName}</span> has been signed out.
        </p>
        <p className="mt-3 opacity-60 text-xl">Have a great rest of your day.</p>
        <p className="mt-12 text-base opacity-50 animate-pulse">Returning to home screen…</p>
      </div>
    )
  }

  return null
}
