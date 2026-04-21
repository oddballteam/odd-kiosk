import { useState, useRef } from 'react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import EmployeeSearch from './EmployeeSearch'
import SignaturePad from './SignaturePad'
import OddballLogo from './OddballLogo'
import VirtualKeyboard from './VirtualKeyboard'
import { TEAL } from '../lib/theme'

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-base xl:text-lg font-semibold text-gray-600 mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-sm font-medium text-red-500">{error}</p>}
    </div>
  )
}

const inputClass = 'w-full px-5 py-4 text-lg xl:text-xl border-2 border-transparent rounded-xl focus:outline-none transition-colors bg-white text-[#4a9e96]'

export default function VisitorSignInForm({ clock, onComplete, onCancel }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [showErrors, setShowErrors] = useState(false)
  const [activeField, setActiveField] = useState(null)

  const nameRef = useRef(null)
  const companyRef = useRef(null)
  const reasonRef = useRef(null)

  const fieldOrder = ['visitor_name', 'visitor_company', 'reason_for_visit']
  const fieldRefs = { visitor_name: nameRef, visitor_company: companyRef, reason_for_visit: reasonRef }

  const handleVirtualKey = (key) => {
    if (!activeField) return
    if (key === 'ENTER') {
      const next = fieldOrder[fieldOrder.indexOf(activeField) + 1]
      if (next) fieldRefs[next].current?.focus()
      else setActiveField(null)
      return
    }
    const current = form[activeField]
    if (key === 'BACKSPACE') update(activeField, current.slice(0, -1))
    else if (key === 'CLEAR') update(activeField, '')
    else update(activeField, current + key)
  }

  const [form, setForm] = useState({
    host: null,
    visitor_name: '',
    visitor_company: '',
    reason_for_visit: '',
    signature: null,
  })

  const update = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const fieldErrors = {
    host: !form.host ? 'Please select who you are here to see.' : null,
    visitor_name: !form.visitor_name.trim() ? 'Full name is required.' : null,
    visitor_company: !form.visitor_company.trim() ? 'Company is required.' : null,
    reason_for_visit: !form.reason_for_visit.trim() ? 'Reason for visit is required.' : null,
    signature: !form.signature ? 'Signature is required.' : null,
  }
  const hasErrors = Object.values(fieldErrors).some(Boolean)

  const handleSubmit = async () => {
    if (hasErrors) { setShowErrors(true); return }
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

      {/* ── Teal side ── */}
      <div className="flex-[2] lg:flex-1 flex flex-col px-10 py-8 text-white" style={{ backgroundColor: TEAL }}>
        <div className="flex items-center gap-4 mb-8">
          <span className="font-semibold tracking-wide text-2xl xl:text-3xl">Oddball Visitor Check-In</span>
        </div>

        <h2 className="text-3xl xl:text-4xl font-bold mb-5">Who are you here to see?</h2>
        <EmployeeSearch value={form.host} onChange={emp => update('host', emp)} />
        {showErrors && fieldErrors.host && (
          <p className="mt-1.5 inline-block text-sm font-medium text-red-500 bg-white rounded-md px-2 py-0.5">{fieldErrors.host}</p>
        )}

        <div className="flex-1" />

        {/* Clock at bottom */}
        {clock && (
          <div className="mt-auto pt-6 hidden lg:flex items-end justify-between">
            <p className="text-white/50 text-lg xl:text-xl tabular-nums font-light">{format(clock, 'h:mm a')}</p>
            <p className="text-white/50 text-lg xl:text-xl tabular-nums">{format(clock, 'EEEE, MMMM d, yyyy')}</p>
          </div>
        )}
      </div>

      {/* ── Cream side ── */}
      <div className="flex-[3] lg:flex-1 flex flex-col px-10 py-6 lg:py-8 overflow-y-auto" style={{ backgroundColor: '#f0ede7' }}>
        <h2 className="text-2xl xl:text-3xl font-bold text-gray-800 mb-5">About you</h2>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Full Name" required error={showErrors ? fieldErrors.visitor_name : null}>
                <input
                  ref={nameRef}
                  type="text"
                  value={form.visitor_name}
                  onChange={e => update('visitor_name', e.target.value)}
                  placeholder="Jane Smith"
                  className={inputClass}
                  onFocus={e => { focusTeal(e); setActiveField('visitor_name') }}
                  onBlur={e => { blurClear(e); setActiveField(null) }}
                />
              </Field>
              {activeField === 'visitor_name' && <VirtualKeyboard onKey={handleVirtualKey} />}
            </div>

            <div className="col-span-2">
              <Field label="Company" required error={showErrors ? fieldErrors.visitor_company : null}>
                <input
                  ref={companyRef}
                  type="text"
                  value={form.visitor_company}
                  onChange={e => update('visitor_company', e.target.value)}
                  placeholder="Acme Corp"
                  className={inputClass}
                  onFocus={e => { focusTeal(e); setActiveField('visitor_company') }}
                  onBlur={e => { blurClear(e); setActiveField(null) }}
                />
              </Field>
              {activeField === 'visitor_company' && <VirtualKeyboard onKey={handleVirtualKey} />}
            </div>

            <div className="col-span-2">
              <Field label="Reason for Visit" required error={showErrors ? fieldErrors.reason_for_visit : null}>
                <textarea
                  ref={reasonRef}
                  value={form.reason_for_visit}
                  onChange={e => update('reason_for_visit', e.target.value)}
                  placeholder="e.g. Sales meeting, Job interview, Delivery, etc."
                  rows={2}
                  className={`${inputClass} resize-none`}
                  onFocus={e => { focusTeal(e); setActiveField('reason_for_visit') }}
                  onBlur={e => { blurClear(e); setActiveField(null) }}
                />
              </Field>
              {activeField === 'reason_for_visit' && <VirtualKeyboard onKey={handleVirtualKey} />}
            </div>

            <div className="col-span-2">
              <Field label="Signature" required error={showErrors ? fieldErrors.signature : null}>
                <SignaturePad onChange={dataUrl => update('signature', dataUrl)} />
              </Field>
            </div>
          </div>

          {error && (
            <div className="mt-2 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-base">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-4 xl:py-5 px-6 text-lg xl:text-xl font-semibold rounded-xl transition-colors text-gray-500 bg-white hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-[2] py-4 xl:py-5 px-6 text-lg xl:text-xl font-semibold text-white rounded-xl transition-opacity hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ backgroundColor: TEAL }}
            >
              {submitting ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
