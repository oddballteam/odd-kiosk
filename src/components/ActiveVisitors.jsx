import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { supabase } from '../lib/supabase'
import { TEAL } from '../lib/theme'

export default function ActiveVisitors() {
  const [visitors, setVisitors] = useState([])
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(null)

  const fetchActive = async () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data, error } = await supabase
      .from('visitor_log')
      .select('*')
      .eq('visit_date', today)
      .is('time_out', null)
      .order('time_in', { ascending: true })

    if (!error) setVisitors(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchActive()
    // Refresh every 30 seconds
    const interval = setInterval(fetchActive, 30_000)
    return () => clearInterval(interval)
  }, [])

  const handleSignOut = async (id) => {
    setSigning(id)
    const { error } = await supabase
      .from('visitor_log')
      .update({ time_out: new Date().toISOString() })
      .eq('id', id)

    if (!error) {
      setVisitors(v => v.filter(vis => vis.id !== id))
    }
    setSigning(null)
  }

  const handleVerifyId = async (id, verified) => {
    const { error } = await supabase
      .from('visitor_log')
      .update({ id_verified: verified })
      .eq('id', id)

    if (!error) {
      setVisitors(v => v.map(vis => vis.id === id ? { ...vis, id_verified: verified } : vis))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: TEAL, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (visitors.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-lg font-medium">No active visitors</p>
        <p className="text-sm">Signed-in visitors will appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {visitors.map(vis => (
        <div key={vis.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-gray-900 text-lg">{vis.visitor_name}</p>
                {vis.visitor_title && (
                  <span className="text-sm text-gray-500">· {vis.visitor_title}</span>
                )}
              </div>
              <p className="text-sm text-gray-500">{vis.visitor_company}</p>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                <span>
                  <span className="text-gray-400">Visiting:</span>{' '}
                  <span className="font-medium">{vis.host_employee_name}</span>
                </span>
                <span>
                  <span className="text-gray-400">In:</span>{' '}
                  <span className="font-medium">{format(parseISO(vis.time_in), 'h:mm a')}</span>
                </span>
                <span>
                  <span className="text-gray-400">Reason:</span>{' '}
                  <span className="font-medium">{vis.reason_for_visit}</span>
                </span>
              </div>

              {/* ID verified toggle */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleVerifyId(vis.id, !vis.id_verified)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                  style={vis.id_verified
                    ? { backgroundColor: `${TEAL}20`, color: TEAL }
                    : { backgroundColor: '#fefce8', color: '#92400e', border: '1px solid #fde68a' }
                  }
                >
                  {vis.id_verified ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      ID Verified
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      ID Not Verified
                    </>
                  )}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSignOut(vis.id)}
              disabled={signing === vis.id}
              className="flex-shrink-0 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-semibold rounded-lg text-sm transition-colors disabled:opacity-40"
            >
              {signing === vis.id ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
