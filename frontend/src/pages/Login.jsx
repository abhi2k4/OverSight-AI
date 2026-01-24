import { useNavigate } from 'react-router-dom'
import { IconShieldCheck } from '@tabler/icons-react'
import { useAppStore } from '../store/appStore'

export default function Login() {
  const navigate = useNavigate()
  const setAuthenticated = useAppStore((state) => state.setAuthenticated)

  const handleLogin = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const role = formData.get('role')

    const roleNames = {
      admin: 'Admin User',
      steward: 'Data Steward',
      engineer: 'AI Engineer',
      auditor: 'Auditor',
    }

    setAuthenticated(true, { role: roleNames[role], name: roleNames[role] })
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary-light/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary-light/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="/OverSight.png" 
            alt="OverSight Logo" 
            className="w-10 h-10 rounded-md object-cover"
          />
          <h1 className="text-xl font-bold tracking-tight text-slate-900">OverSight</h1>
        </div>
        <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-full border border-slate-200 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            System Operational
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white border border-border shadow-card rounded-xl overflow-hidden backdrop-blur-sm">
            {/* Card Header */}
            <div className="px-8 py-6 border-b border-border bg-background">
              <h2 className="text-2xl font-bold text-text-primary mb-2">Welcome Back</h2>
              <p className="text-text-secondary text-sm">
                Securely access the Governance & Compliance Platform
              </p>
            </div>

            {/* Card Body */}
            <form onSubmit={handleLogin} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Select Role (Demo Context)
                </label>
                <div className="relative">
                  <select
                    name="role"
                    defaultValue="admin"
                    className="w-full appearance-none bg-white border border-slate-300 text-slate-900 text-sm rounded-lg px-4 py-3 pr-10 focus:outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 transition-colors cursor-pointer shadow-sm"
                  >
                    <option value="admin">Org Admin</option>
                    <option value="steward">Data Steward</option>
                    <option value="engineer">AI Engineer</option>
                    <option value="auditor">Auditor</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center py-2">
                <div className="flex-grow border-t border-border" />
                <span className="px-4 text-xs text-text-tertiary">Quick Access</span>
                <div className="flex-grow border-t border-border" />
              </div>

              <button
                type="submit"
                className="w-full bg-[#1E40AF] hover:bg-[#1e3a8a] text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-sm hover:shadow-md"
              >
                Access Dashboard
              </button>

              <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <svg className="w-5 h-5 text-[#1E40AF] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-[#1E40AF]">
                  This is a demo environment. Select any role to explore the platform.
                </p>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-text-tertiary">
              © 2026 OverSight. Enterprise Governance Platform.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
