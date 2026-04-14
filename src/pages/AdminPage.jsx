import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { supabase } from '../lib/supabase'
import ActiveVisitors from '../components/ActiveVisitors'
import OddballLogo from '../components/OddballLogo'
import { TEAL } from '../lib/theme'

const TAB = { ACTIVE: 'active', HISTORY: 'history' }

export default function AdminPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState(TAB.ACTIVE)
  const [history, setHistory] = useState([])
  const [historyDate, setHistoryDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') !== '1') navigate('/admin/login')
  }, [navigate])

  useEffect(() => {
    if (tab !== TAB.HISTORY) return
    setLoadingHistory(true)
    supabase
      .from('visitor_log')
      .select('*')
      .eq('visit_date', historyDate)
      .order('time_in', { ascending: false })
      .then(({ data }) => {
        setHistory(data || [])
        setLoadingHistory(false)
      })
  }, [tab, historyDate])

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
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-6">

        {tab === TAB.ACTIVE && (
          <>
            <p className="text-sm text-gray-400 mb-4">
              Currently signed-in visitors · refreshes every 30 seconds
            </p>
            <ActiveVisitors />
          </>
        )}

        {tab === TAB.HISTORY && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <label className="text-sm font-medium text-gray-600">Date</label>
              <input
                type="date"
                value={historyDate}
                onChange={e => setHistoryDate(e.target.value)}
                className="border-2 border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none transition-colors"
                onFocus={e => e.target.style.borderColor = TEAL}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            {loadingHistory ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: TEAL, borderTopColor: 'transparent' }} />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-lg font-medium">No visits recorded</p>
                <p className="text-sm">for {format(parseISO(historyDate), 'MMMM d, yyyy')}</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200">
                    <tr style={{ backgroundColor: `${TEAL}12` }}>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Visitor</th>
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
