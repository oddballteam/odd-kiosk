import { Routes, Route } from 'react-router-dom'
import KioskPage from './pages/KioskPage'
import AdminPage from './pages/AdminPage'
import AdminLogin from './pages/AdminLogin'
import { MOCK_MODE } from './lib/supabase'

export default function App() {
  return (
    <>
      {MOCK_MODE && (
        <div className="fixed top-0 inset-x-0 z-[9999] bg-amber-400 text-amber-900 text-xs font-bold text-center py-1 tracking-wide">
          MOCK MODE — no Supabase connection · data resets on page reload
        </div>
      )}
      <div className={MOCK_MODE ? 'pt-6' : ''}>
        <Routes>
          <Route path="/" element={<KioskPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
    </>
  )
}
