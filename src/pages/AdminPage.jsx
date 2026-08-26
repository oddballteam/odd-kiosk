import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO, subDays } from 'date-fns'
import { supabase } from '../lib/supabase'
import ActiveVisitors from '../components/ActiveVisitors'
import EmployeeDirectory from '../components/EmployeeDirectory'
import OddballLogo from '../components/OddballLogo'
import { TEAL } from '../lib/theme'

const TAB = { ACTIVE: 'active', HISTORY: 'history', DIRECTORY: 'directory' }

function exportCSV(rows, filename) {
  const headers = ['Date', 'Visitor', 'Title', 'Company', 'Visiting', 'Time In', 'Time Out', 'ID Verified']
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [
    headers.join(','),
    ...rows.map(r => [
      escape(r.visit_date),
      escape(r.visitor_name),
      escape(r.visitor_title),
      escape(r.visitor_company),
      escape(r.host_employee_name),
      escape(r.time_in ? format(parseISO(r.time_in), 'h:mm a') : ''),
      escape(r.time_out ? format(parseISO(r.time_out), 'h:mm a') : 'Active'),
      escape(r.id_verified ? 'Yes' : 'No'),
    ].join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function AdminPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState(TAB.ACTIVE)
  const [history, setHistory] = useState([])
  const [historyDate, setHistoryDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [showAllDates, setShowAllDates] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [signingOutAll, setSigningOutAll] = useState(false)
  const [signOutAllResult, setSignOutAllResult] = useState(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState(null)
  const [showRangePicker, setShowRangePicker] = useState(false)
  const [rangeFrom, setRangeFrom] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [rangeTo, setRangeTo] = useState(format(new Date(), 'yyyy-MM-dd'))
  const exportRef = useRef(null)

  useEffect(() => {
    if (!exportOpen && !showRangePicker) return
    const handler = e => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false)
        setShowRangePicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [exportOpen, showRangePicker])

  const fetchAndExport = async (fromDate, toDate, filename) => {
    setExporting(true)
    setExportError(null)
    const { data, error } = await supabase
      .from('visitor_log')
      .select('*')
      .gte('visit_date', fromDate)
      .lte('visit_date', toDate)
      .order('visit_date', { ascending: false })
    setExporting(false)
    if (error) { setExportError('Export failed: ' + error.message); return }
    if (!data || data.length === 0) { setExportError('No visits found for that range.'); return }
    exportCSV(data, filename)
  }

  const handleExport = (range) => {
    setExportOpen(false)
    if (range === 'date') { setShowRangePicker(true); return }
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const days = { week: 6, month: 29, year: 364 }
    const label = { week: 'last-7-days', month: 'last-30-days', year: 'last-year' }
    fetchAndExport(format(subDays(new Date(), days[range]), 'yyyy-MM-dd'), todayStr, `visitors-${label[range]}-${todayStr}.csv`)
  }

  const handleRangeExport = () => {
    setShowRangePicker(false)
    fetchAndExport(rangeFrom, rangeTo, `visitors-${rangeFrom}-to-${rangeTo}.csv`)
  }

  const handleSignOutAll = async () => {
    if (!window.confirm('Sign out all visitors who are still checked in? This cannot be undone.')) return
    setSigningOutAll(true)
    setSignOutAllResult(null)
    const { data, error } = await supabase
      .from('visitor_log')
      .update({ time_out: new Date().toISOString() })
      .is('time_out', null)
      .select('id')
    setSigningOutAll(false)
    if (error) {
      setSignOutAllResult({ ok: false, message: 'Something went wrong.' })
    } else {
      setSignOutAllResult({ ok: true, message: `${data.length} visitor${data.length !== 1 ? 's' : ''} signed out.` })
    }
  }

  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') !== '1') navigate('/admin/login')
  }, [navigate])

  useEffect(() => {
    if (tab !== TAB.HISTORY) return
    setLoadingHistory(true)
    let query = supabase.from('visitor_log').select('*').order('time_in', { ascending: false })
    if (!showAllDates) query = query.eq('visit_date', historyDate)
    query.then(({ data }) => {
      setHistory(data || [])
      setLoadingHistory(false)
    })
  }, [tab, historyDate, showAllDates])

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Teal header */}
      <header className="text-white px-6 py-4 flex items-center justify-between" style={{ backgroundColor: TEAL }}>
        <div className="flex items-center gap-3">
          <OddballLogo size={32} />
          <div>
            <p className="font-semibold leading-tight">Visitor Admin</p>
            <p className="text-xs opacity-70">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" className="text-sm text-white/80 hover:text-white transition-colors">
            ← Kiosk View
          </a>
          <button
            onClick={handleLogout}
            className="text-sm px-3 py-1.5 rounded-lg border border-white/30 hover:bg-white/10 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200">
        <nav className="flex px-6 max-w-5xl mx-auto">
          <TabButton teal={TEAL} active={tab === TAB.ACTIVE} onClick={() => setTab(TAB.ACTIVE)}>
            Active Visitors
          </TabButton>
          <TabButton teal={TEAL} active={tab === TAB.HISTORY} onClick={() => setTab(TAB.HISTORY)}>
            Visit History
          </TabButton>
          <TabButton teal={TEAL} active={tab === TAB.DIRECTORY} onClick={() => setTab(TAB.DIRECTORY)}>
            Employee Directory
          </TabButton>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-6">

        {tab === TAB.ACTIVE && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400">Currently signed-in visitors · refreshes every 30 seconds</p>
              <button
                onClick={handleSignOutAll}
                disabled={signingOutAll}
                className="text-sm px-4 py-2 rounded-lg font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#e05050' }}
              >
                {signingOutAll ? 'Signing out...' : 'Sign Out All'}
              </button>
            </div>
            {signOutAllResult && (
              <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${signOutAllResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {signOutAllResult.message}
              </div>
            )}
            <ActiveVisitors />
          </>
        )}

        {tab === TAB.DIRECTORY && <EmployeeDirectory />}

        {tab === TAB.HISTORY && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-600">Date</label>
                  <input
                    type="date"
                    value={historyDate}
                    onChange={e => setHistoryDate(e.target.value)}
                    disabled={showAllDates}
                    className="border-2 border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none transition-colors disabled:opacity-40"
                    onFocus={e => e.target.style.borderColor = TEAL}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAllDates}
                    onChange={e => setShowAllDates(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  All dates
                </label>
              </div>
              <div className="relative" ref={exportRef}>
                <button
                  onClick={() => { setShowRangePicker(false); setExportOpen(o => !o) }}
                  disabled={exporting}
                  className="text-sm px-4 py-2 rounded-lg font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                  style={{ backgroundColor: TEAL }}
                >
                  {exporting ? 'Exporting...' : 'Export CSV'}
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {exportOpen && (
                  <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10">
                    {[
                      { range: 'date', label: 'Date range' },
                      { range: 'week', label: 'Last 7 days' },
                      { range: 'month', label: 'Last 30 days' },
                      { range: 'year', label: 'Last year' },
                    ].map(({ range, label }) => (
                      <button
                        key={range}
                        onClick={() => handleExport(range)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                {showRangePicker && (
                  <div className="absolute right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 p-4 z-10 flex flex-col gap-3 w-64">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-500">From</label>
                      <input
                        type="date"
                        value={rangeFrom}
                        onChange={e => setRangeFrom(e.target.value)}
                        className="border-2 border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none transition-colors"
                        onFocus={e => e.target.style.borderColor = TEAL}
                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-500">To</label>
                      <input
                        type="date"
                        value={rangeTo}
                        onChange={e => setRangeTo(e.target.value)}
                        className="border-2 border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none transition-colors"
                        onFocus={e => e.target.style.borderColor = TEAL}
                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                    <button
                      onClick={handleRangeExport}
                      disabled={!rangeFrom || !rangeTo || rangeFrom > rangeTo}
                      className="w-full py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                      style={{ backgroundColor: TEAL }}
                    >
                      Export
                    </button>
                  </div>
                )}
              </div>
            </div>

            {exportError && (
              <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium bg-red-50 text-red-700 flex items-center justify-between">
                {exportError}
                <button onClick={() => setExportError(null)} className="ml-4 text-red-400 hover:text-red-600">✕</button>
              </div>
            )}

            {loadingHistory ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: TEAL, borderTopColor: 'transparent' }} />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-lg font-medium">No visits recorded</p>
                <p className="text-sm">{showAllDates ? 'across any date' : `for ${format(parseISO(historyDate), 'MMMM d, yyyy')}`}</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200">
                    <tr style={{ backgroundColor: `${TEAL}12` }}>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Visitor</th>
                      {showAllDates && <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>}
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Company</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Visiting</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">In</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Out</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map(vis => (
                      <tr key={vis.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{vis.visitor_name}</p>
                          {vis.visitor_title && <p className="text-xs text-gray-400">{vis.visitor_title}</p>}
                        </td>
                        {showAllDates && (
                          <td className="px-4 py-3 text-gray-600">{format(parseISO(vis.visit_date), 'MMM d, yyyy')}</td>
                        )}
                        <td className="px-4 py-3 text-gray-600">{vis.visitor_company}</td>
                        <td className="px-4 py-3 text-gray-600">{vis.host_employee_name}</td>
                        <td className="px-4 py-3 text-gray-600">{format(parseISO(vis.time_in), 'h:mm a')}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {vis.time_out
                            ? format(parseISO(vis.time_out), 'h:mm a')
                            : <span className="font-medium" style={{ color: TEAL }}>Active</span>}
                        </td>
                        <td className="px-4 py-3">
                          {vis.id_verified ? (
                            <span className="inline-flex items-center gap-1 text-white px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: TEAL }}>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              Verified
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, children, teal }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px"
      style={{
        borderColor: active ? teal : 'transparent',
        color: active ? teal : '#6b7280',
      }}
    >
      {children}
    </button>
  )
}
