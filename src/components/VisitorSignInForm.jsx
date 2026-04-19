import { useState } from 'react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import EmployeeSearch from './EmployeeSearch'
import SignaturePad from './SignaturePad'
import OddballLogo from './OddballLogo'
import { TEAL } from '../lib/theme'

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-600 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass = 'w-full px-4 py-3 text-base border-2 border-transparent rounded-xl focus:outline-none transition-colors bg-white'

export default function VisitorSignInForm({ clock, onComplete, onCancel }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    host: null,
    visitor_name: '',
    visitor_company: '',
    reason_for_visit: '',
    signature: null,
  })

  const update = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const canSubmit =
    form.host &&
    form.visitor_name.trim() &&
    form.visitor_company.trim() &&
    form.reason_for_visit.trim() &&
    form.signature

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    const signTime = new Date()

    const { error: insertError } = await supabase.from('visitor_log').insert({
      visitor_name: form.visitor_name.trim(),
      visitor_company: form.visitor_company.trim(),
      reason_for_visit: form.reason_for_visit.trim(),
      host_employee_id: form.host.id,
      host_employee_name: form.host.full_name,
      visit_date: format(signTime, 'yyyy-MM-dd'),
      time_in: signTime.toISOString(),
      signature: form.signature,
    })

    setSubmitting(false)

    if (insertError) {
      setError('Something went wrong. Please try again or ask the receptionist for help.')
      return
    }

    onComplete({
      visitorName: form.visitor_name,
      hostName: form.host.full_name,
      timeIn: format(signTime, 'h:mm a'),
    })
  }

  const focusTeal = e => e.target.style.borderColor = TEAL
  const blurClear = e => e.target.style.borderColor = 'transparent'

  return (
    <div className="flex-1 flex flex-col lg:flex-row">

      {/* ── Teal side — top in portrait, left in landscape ── */}
      <div className="flex-[2] lg:flex-1 flex flex-col px-8 py-6 text-white" style={{ backgroundColor: TEAL }}>
        {/* Logo + clock */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <OddballLogo size={32} />
            <span className="font-semibold tracking-wide">Oddball Visitor Check-In</span>
          </div>
          {clock && (
            <span className="text-white/70 text-sm tabular-nums hidden lg:block">
              {format(clock, 'h:mm a · EEEE, MMMM d, yyyy')}
            </span>
          )}
        </div>

        {/* Who are you visiting */}
        <h2 className="text-2xl font-light mb-4">Who are you here to see?</h2>
        <EmployeeSearch value={form.host} onChange={emp => update('host', emp)} />

        {/* Selected employee card */}
        {form.host && (
          <div className="mt-4 rounded-xl p-4 flex items-center gap-3 bg-white/20">
            <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold flex-shrink-0 bg-white" style={{ color: TEAL }}>
              {form.host.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <div>
              <p className="font-semibold">{form.host.full_name}</p>
              {(form.host.title || form.host.department) && (
                <p className="text-sm text-white/70">{[form.host.title, form.host.department].filter(Boolean).join(' · ')}</p>
              )}
            </div>
          </div>
        )}

        {/* Placeholder when no host selected */}
        {!form.host && (
          <div className="hidden lg:flex flex-col items-center justify-center flex-1 gap-4 opacity-30">
            <OddballLogo size={72} />
          </div>
        )}
      </div>

      {/* ── Cream side — bottom in portrait, right in landscape ── */}
      <div className="flex-[3] lg:flex-1 flex flex-col px-8 py-4 lg:py-6" style={{ backgroundColor: '#f0ede7' }}>
        <h2 className="text-xl font-bold text-gray-800 mb-4">About you</h2>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Field label="Full Name" required>
                <input
                  type="text"
                  value={form.visitor_name}
                  onChange={e => update('visitor_name', e.target.value)}
                  placeholder="Jane Smith"
                  className={inputClass}
                  onFocus={focusTeal}
                  onBlur={blurClear}
                />
              </Field>
            </div>

            <div className="col-span-2">
              <Field label="Company" required>
                <input
                  type="text"
                  value={form.visitor_company}
                  onChange={e => update('visitor_company', e.target.value)}
                  placeholder="Acme Corp"
                  className={inputClass}
                  onFocus={focusTeal}
                  onBlur={blurClear}
                />
              </Field>
            </div>

            <div className="col-span-2">
              <Field label="Reason for Visit" required>
                <textarea
                  value={form.reason_for_visit}
                  onChange={e => update('reason_for_visit', e.target.value)}
                  placeholder="e.g. Sales meeting, Job interview, Delivery, etc."
                  rows={2}
                  className={`${inputClass} resize-none`}
                  onFocus={focusTeal}
                  onBlur={blurClear}
                />
              </Field>
            </div>

            <div className="col-span-2">
              <Field label="Signature" required>
                <SignaturePad onChange={dataUrl => update('signature', dataUrl)} />
              </Field>
            </div>
          </div>

          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-6 text-base font-semibold rounded-xl transition-colors text-gray-500 bg-white hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="flex-[2] py-3 px-6 text-base font-semibold text-white rounded-xl transition-opacity hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ backgroundColor: TEAL }}
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : 'Complete Sign-In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
