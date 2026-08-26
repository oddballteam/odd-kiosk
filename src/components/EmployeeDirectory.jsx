import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { TEAL } from '../lib/theme'

const EMPTY_FORM = { full_name: '', title: '', department: '', slack_user_id: '', active: true }

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null) // employee id being edited
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)

  const load = async () => {
    const { data } = await supabase
      .from('employees')
      .select('id, full_name, title, department, slack_user_id, active')
      .order('full_name')
    setEmployees(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError(null)
    setShowForm(true)
  }

  const openEdit = (emp) => {
    setEditing(emp.id)
    setForm({ full_name: emp.full_name, title: emp.title || '', department: emp.department || '', slack_user_id: emp.slack_user_id || '', active: emp.active })
    setError(null)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  const handleSave = async () => {
    if (!form.full_name.trim()) { setError('Name is required.'); return }
    setSaving(true)
    setError(null)

    const payload = {
      full_name: form.full_name.trim(),
      title: form.title.trim() || null,
      department: form.department.trim() || null,
      slack_user_id: form.slack_user_id.trim() || null,
      active: form.active,
    }

    const { data, error: err } = editing
      ? await supabase.from('employees').update(payload).eq('id', editing).select()
      : await supabase.from('employees').insert(payload).select()

    setSaving(false)
    if (err) { setError('Something went wrong. Please try again.'); return }
    if (!data || data.length === 0) { setError('The database rejected this change (check the employees table policies in Supabase).'); return }
    closeForm()
    load()
  }

  const handleDelete = async (emp) => {
    if (!window.confirm(`Permanently delete ${emp.full_name}? This cannot be undone.`)) return
    setActionError(null)
    const { error: err } = await supabase.from('employees').delete().eq('id', emp.id)
    if (err) { setActionError(`Couldn't delete ${emp.full_name}: ${err.message}`); return }
    load()
  }

  const active = employees.filter(e => e.active)
  const inactive = employees.filter(e => !e.active)

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: TEAL, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div>
      {/* Add button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={openAdd}
          className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90"
          style={{ backgroundColor: TEAL }}
        >
          + Add Employee
        </button>
      </div>

      {actionError && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium bg-red-50 text-red-700 flex items-center justify-between">
          {actionError}
          <button onClick={() => setActionError(null)} className="ml-4 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              {editing ? 'Edit Employee' : 'Add Employee'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Jane Smith"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition-colors"
                  onFocus={e => e.target.style.borderColor = TEAL}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Title / Role</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Senior Engineer"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition-colors"
                  onFocus={e => e.target.style.borderColor = TEAL}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Department</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  placeholder="Engineering"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition-colors"
                  onFocus={e => e.target.style.borderColor = TEAL}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Slack User ID
                  <span className="ml-1 font-normal text-gray-400">(for check-in notifications)</span>
                </label>
                <input
                  type="text"
                  value={form.slack_user_id}
                  onChange={e => setForm(f => ({ ...f, slack_user_id: e.target.value }))}
                  placeholder="U012AB3CD"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition-colors font-mono text-sm"
                  onFocus={e => e.target.style.borderColor = TEAL}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Active (appears in kiosk directory)</span>
              </label>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeForm}
                className="flex-1 py-3 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-[2] py-3 text-sm font-semibold text-white rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: TEAL }}
              >
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Employee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active employees */}
      <EmployeeTable
        employees={active}
        emptyMessage="No active employees."
        onEdit={openEdit}
        onDelete={handleDelete}
        teal={TEAL}
      />

      {/* Inactive employees */}
      {inactive.length > 0 && (
        <div className="mt-8">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Inactive</p>
          <EmployeeTable
            employees={inactive}
            onEdit={openEdit}
            onDelete={handleDelete}
            teal={TEAL}
            dimmed
          />
        </div>
      )}
    </div>
  )
}

function EmployeeTable({ employees, emptyMessage, onEdit, onDelete, teal, dimmed }) {
  if (employees.length === 0 && emptyMessage) {
    return <p className="text-sm text-gray-400 py-4">{emptyMessage}</p>
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm ${dimmed ? 'opacity-60' : ''}`}>
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200">
          <tr style={{ backgroundColor: `${teal}12` }}>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Title</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Department</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {employees.map(emp => (
            <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900">{emp.full_name}</td>
              <td className="px-4 py-3 text-gray-500">{emp.title || '—'}</td>
              <td className="px-4 py-3 text-gray-500">{emp.department || '—'}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(emp)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(emp)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
