import { createClient } from '@supabase/supabase-js'
import { mockSupabase } from './mockSupabase.js'

export const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true'

let supabase

if (MOCK_MODE) {
  supabase = mockSupabase
} else {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '[supabase] Missing env vars. Copy .env.example → .env and fill in your values, ' +
      'or run `npm run dev:mock` to use mock data.'
    )
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase }
