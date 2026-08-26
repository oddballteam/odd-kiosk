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
