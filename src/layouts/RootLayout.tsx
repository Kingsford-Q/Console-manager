import { useAuth } from '@/features/auth/context'
import { Button } from '@/components/ui/button'
import {
  LogOut,
  LayoutDashboard,
  Mail,
  Award,
  Monitor,
  FileText,
  Lightbulb,
  CreditCard,
  Settings,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import DashboardPage from '@/features/dashboard/pages/DashboardPage'
import GmailsPage from '@/features/gmails/pages/GmailsPage'
import CertificatesPage from '@/features/certificates/pages/CertificatesPage'
import ConsolesPage from '@/features/consoles/pages/ConsolesPage'
import ApplicationsPage from '@/features/applications/pages/ApplicationsPage'
import AppIdeasPage from '@/features/ideas/pages/AppIdeasPage'
import PaymentDetailsPage from '@/features/payments/pages/PaymentDetailsPage'
import SettingsPage from '@/features/settings/pages/SettingsPage'
import { cn } from '@/lib/utils'

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-slate-600' },
  { id: 'gmails', label: 'Gmail Accounts', icon: Mail, color: 'text-blue-600' },
  { id: 'certificates', label: 'Certificates', icon: Award, color: 'text-violet-600' },
  { id: 'consoles', label: 'Console Accounts', icon: Monitor, color: 'text-amber-600' },
  { id: 'applications', label: 'Applications', icon: FileText, color: 'text-emerald-600' },
  { id: 'ideas', label: 'App Ideas', icon: Lightbulb, color: 'text-pink-600' },
  { id: 'payments', label: 'Payment Details', icon: CreditCard, color: 'text-teal-600' },
  { id: 'settings', label: 'Settings', icon: Settings, color: 'text-gray-600' },
] as const

type PageId = (typeof navigationItems)[number]['id']

const pageComponents: Record<PageId, React.ComponentType> = {
  dashboard: DashboardPage,
  gmails: GmailsPage,
  certificates: CertificatesPage,
  consoles: ConsolesPage,
  applications: ApplicationsPage,
  ideas: AppIdeasPage,
  payments: PaymentDetailsPage,
  settings: SettingsPage,
}

export default function RootLayout() {
  const { user, signOut } = useAuth()
  const [activePage, setActivePage] = useState<PageId>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const ActiveComponent = pageComponents[activePage]
  const activeLabel = navigationItems.find((i) => i.id === activePage)?.label

  const selectPage = (id: PageId) => {
    setActivePage(id)
    setSidebarOpen(false)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r bg-card transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-sm">
              <span className="text-sm font-bold text-primary-foreground">CM</span>
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">Console Manager</h1>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
          <button
            className="text-muted-foreground hover:text-foreground lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.id
            return (
              <button
                key={item.id}
                onClick={() => selectPage(item.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary' : item.color)} />
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="border-t p-3">
          <div className="mb-3 flex items-center gap-3 rounded-md bg-muted/50 px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
              {user?.full_name
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium leading-tight">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <Button onClick={signOut} variant="outline" className="w-full" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center gap-3 border-b bg-card px-4 py-5 sm:px-8">
          <button
            className="text-muted-foreground hover:text-foreground lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="truncate text-xl font-semibold tracking-tight">{activeLabel}</h2>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-8">
          <ActiveComponent />
        </div>
      </main>
    </div>
  )
}
