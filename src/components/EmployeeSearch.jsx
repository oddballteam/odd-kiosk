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

    if (value && query === value.full_name) return

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
          className="w-full px-5 py-5 text-xl xl:text-2xl font-semibold border-2 border-transparent rounded-xl focus:outline-none transition-colors text-[#4a9e96] placeholder:text-gray-400 placeholder:font-normal"
          style={{ backgroundColor: 'white' }}
          onFocus={e => {
            e.target.style.borderColor = TEAL
            setShowKeyboard(true)
            if (query.length >= 1 && results.length > 0) setOpen(true)
          }}
          onClick={() => setShowKeyboard(true)}
          onBlur={e => e.target.style.borderColor = 'transparent'}
        />
        {loading && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: TEAL, borderTopColor: 'transparent' }} />
          </div>
        )}
        {value && (
          <button
            type="button"
            onMouseDown={e => {
              e.preventDefault()
              setQuery('')
              onChange(null)
              setShowKeyboard(true)
              inputRef.current?.focus()
            }}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="w-full mt-1 border-2 border-transparent rounded-xl shadow-xl max-h-64 overflow-y-auto" style={{ backgroundColor: '#f0ede7' }}>
          {results.map((emp) => (
            <li
              key={emp.id}
              onMouseDown={() => handleSelect(emp)}
              className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors border-b border-black/5 last:border-0 hover:brightness-95"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-base flex-shrink-0" style={{ backgroundColor: TEAL }}>
                {emp.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg xl:text-xl">{emp.full_name}</p>
                {(emp.title || emp.department) && (
                  <p className="text-base text-gray-500">
                    {[emp.title, emp.department].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {open && !loading && results.length === 0 && query.length >= 1 && (
        <div className="w-full mt-1 rounded-xl shadow-xl px-5 py-4 text-gray-500 text-lg" style={{ backgroundColor: '#f0ede7' }}>
          No employees found matching "{query}"
        </div>
      )}

      {showKeyboard && (
        <VirtualKeyboard onKey={handleVirtualKey} />
      )}
    </div>
  )
}
