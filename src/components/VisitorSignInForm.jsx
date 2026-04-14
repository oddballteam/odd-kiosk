import { useState, useRef } from 'react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import EmployeeSearch from './EmployeeSearch'
import SignaturePad from './SignaturePad'
import { TEAL } from '../lib/theme'

const STEPS = ['Who are you visiting?', 'Your information', 'Review & sign']

export default function VisitorSignInForm({ onComplete, onCancel }) {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const sigRef = useRef(null)

  const [form, setForm] = useState({
    host: null,
    visitor_name: '',
    visitor_title: '',
    visitor_company: '',
    reason_for_visit: '',
    signature: null,
  })

  const now = new Date()

  const update = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const canProceedStep0 = !!form.host
  const canProceedStep1 =
    form.visitor_name.trim() &&
    form.visitor_company.trim() &&
    form.reason_for_visit.trim()
  const canSubmit = form.signature

  const next = () => setStep(s => s + 1)
  const back = () => setStep(s => s - 1)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    const signTime = new Date()

    const { error: insertError } = await supabase.from('visitor_log').insert({
      visitor_name: form.visitor_name.trim(),
      visitor_title: form.visitor_title.trim() || null,
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

  return (
    <div className="flex flex-col h-full">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold flex-shrink-0 transition-all"
              style={{
                backgroundColor: i <= step ? TEAL : '#e5e7eb',
                color: i <= step ? 'white' : '#9ca3af',
                opacity: i < step ? 0.65 : 1,
              }}
            >
              {i < step ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : i + 1}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${i === step ? 'text-blue-600' : 'text-gray-400'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 ml-2 transition-colors" style={{ backgroundColor: i < step ? TEAL : '#e5e7eb' }} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-visible">

        {/* Step 0 — Who are you visiting */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Who are you here to see?</h2>
              <p className="text-gray-500">Start typing a name to search our directory.</p>
            </div>
            <EmployeeSearch value={form.host} onChange={emp => update('host', emp)} />
            {form.host && (
              <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: `${TEAL}15`, border: `1px solid ${TEAL}40` }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ backgroundColor: TEAL }}>
                  {form.host.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{form.host.full_name}</p>
                  {form.host.title && <p className="text-sm text-gray-500">{form.host.title}</p>}
                  {form.host.department && <p className="text-sm text-gray-400">{form.host.department}</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 1 — Visitor info */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Tell us about yourself</h2>
              <p className="text-gray-500">All fields marked * are required.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.visitor_name}
                  onChange={e => update('visitor_name', e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Title / Role
                </label>
                <input
                  type="text"
                  value={form.visitor_title}
                  onChange={e => update('visitor_title', e.target.value)}
                  placeholder="Senior Account Manager"
                  className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Company / Organization <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.visitor_company}
                  onChange={e => update('visitor_company', e.target.value)}
                  placeholder="Acme Corp"
                  className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Reason for Visit <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.reason_for_visit}
                  onChange={e => update('reason_for_visit', e.target.value)}
                  placeholder="e.g. Sales meeting, Job interview, Delivery, etc."
                  rows={3}
                  className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Auto-populated fields display */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Auto-filled</p>
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-gray-400">Visit Date</p>
                  <p className="font-medium text-gray-700">{format(now, 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Time In</p>
                  <p className="font-medium text-gray-700">Recorded on submit</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Review & sign */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Review & sign</h2>
              <p className="text-gray-500">Please confirm your details and sign below.</p>
            </div>

            {/* Summary card */}
            <div className="bg-gray-50 rounded-xl divide-y divide-gray-200 overflow-hidden border border-gray-200">
              <Row label="Visiting" value={form.host.full_name} />
              <Row label="Your name" value={form.visitor_name} />
              {form.visitor_title && <Row label="Title" value={form.visitor_title} />}
              <Row label="Company" value={form.visitor_company} />
              <Row label="Reason" value={form.reason_for_visit} />
              <Row label="Visit date" value={format(now, 'MMMM d, yyyy')} />
            </div>

            {/* Signature */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Signature <span className="text-red-500">*</span>
              </label>
              <SignaturePad
                ref={sigRef}
                onChange={dataUrl => update('signature', dataUrl)}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-6 border-t border-gray-100 mt-6">
        <button
          type="button"
          onClick={step === 0 ? onCancel : back}
          className="flex-1 py-4 px-6 text-lg font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
        >
          {step === 0 ? 'Cancel' : 'Back'}
        </button>

        {step < 2 && (
          <button
            type="button"
            onClick={next}
            disabled={step === 0 ? !canProceedStep0 : !canProceedStep1}
            className="flex-[2] py-4 px-6 text-lg font-semibold text-white rounded-xl transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: TEAL }}
          >
            Continue
          </button>
        )}

        {step === 2 && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="flex-[2] py-4 px-6 text-lg font-semibold text-white rounded-xl transition-opacity hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ backgroundColor: TEAL }}
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </>
            ) : 'Complete Sign-In'}
          </button>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex gap-4 px-4 py-3">
      <span className="text-sm text-gray-400 w-28 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  )
}
