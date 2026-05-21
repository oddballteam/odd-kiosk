import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { TEAL } from '../lib/theme'

export default function CompanyInput({ value, onChange, className, style, onFocus, onBlur, inputRef }) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => { setQuery(value || '') }, [value])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.trim().length < 1) { setSuggestions([]); return }

    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('visitor_log')
        .select('visitor_company')
        .ilike('visitor_company', `%${query}%`)
        .order('visitor_company')
        .limit(100)

      if (data) {
        // Deduplicate
        const unique = [...new Set(data.map(r => r.visitor_company))]
          .filter(c => c)
          .slice(0, 8)
        setSuggestions(unique)
        setOpen(unique.length > 0)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query])

  const handleChange = (e) => {
    setQuery(e.target.value)
    onChange(e.target.value)
  }

  const handleSelect = (company) => {
    setQuery(company)
    onChange(company)
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Acme Corp"
        className={className}
        style={style}
        onFocus={(e) => { onFocus?.(e); if (suggestions.length > 0) setOpen(true) }}
        onBlur={onBlur}
      />

      {open && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
          {suggestions.map((company) => (
            <li
              key={company}
              onMouseDown={() => handleSelect(company)}
              className="px-4 py-3 cursor-pointer hover:bg-gray-50 text-gray-900 text-sm border-b border-gray-100 last:border-0"
            >
              {company}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
