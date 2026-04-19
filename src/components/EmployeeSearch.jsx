import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { TEAL } from '../lib/theme'
import VirtualKeyboard from './VirtualKeyboard'

export default function EmployeeSearch({ value, onChange }) {
  const [query, setQuery] = useState(value?.full_name || '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showKeyboard, setShowKeyboard] = useState(false)
  const inputRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
        setShowKeyboard(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length < 1) {
      setResults([])
      setOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, title, department')
        .eq('active', true)
        .ilike('full_name', `%${query}%`)
        .order('full_name')
        .limit(20)

      if (!error && data) {
        setResults(data)
        setOpen(true)
      }
      setLoading(false)
    }, 200)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (employee) => {
    setQuery(employee.full_name)
    setOpen(false)
    setShowKeyboard(false)
    onChange(employee)
  }

  const handleInputChange = (e) => {
    setQuery(e.target.value)
    if (value) onChange(null)
  }

  const handleVirtualKey = (key) => {
    if (value) onChange(null)
    if (key === 'BACKSPACE') {
      setQuery(q => q.slice(0, -1))
    } else if (key === 'CLEAR') {
      setQuery('')
    } else {
      setQuery(q => q + key)
    }
    inputRef.current?.focus()
  }

  return (
    <div ref={wrapperRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Type a name to search..."
          className="w-full px-4 py-4 text-lg border-2 border-transparent rounded-xl focus:outline-none transition-colors"
          style={{ backgroundColor: '#f0ede7' }}
          onFocus={e => {
            e.target.style.borderColor = TEAL
            setShowKeyboard(true)
            if (query.length >= 1 && results.length > 0) setOpen(true)
          }}
          onBlur={e => e.target.style.borderColor = 'transparent'}
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: TEAL, borderTopColor: 'transparent' }} />
          </div>
        )}
        {value && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="w-full mt-1 border-2 border-transparent rounded-xl shadow-xl max-h-52 overflow-y-auto" style={{ backgroundColor: '#f0ede7' }}>
          {results.map((emp) => (
            <li
              key={emp.id}
              onMouseDown={() => handleSelect(emp)}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-black/5 last:border-0 hover:brightness-95"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0" style={{ backgroundColor: TEAL }}>
                {emp.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{emp.full_name}</p>
                {(emp.title || emp.department) && (
                  <p className="text-sm text-gray-500">
                    {[emp.title, emp.department].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {open && !loading && results.length === 0 && query.length >= 1 && (
        <div className="w-full mt-1 rounded-xl shadow-xl px-4 py-3 text-gray-500" style={{ backgroundColor: '#f0ede7' }}>
          No employees found matching "{query}"
        </div>
      )}

      {showKeyboard && !value && (
        <VirtualKeyboard onKey={handleVirtualKey} />
      )}
    </div>
  )
}
