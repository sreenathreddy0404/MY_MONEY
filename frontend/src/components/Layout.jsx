import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  Landmark,
  LayoutDashboard,
  LogOut,
  Moon,
  Receipt,
  Settings,
  Sun,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useStore } from '../hooks/useStore.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const nav = [
  { to: '/', label: 'Dashboard', short: 'Home', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Transactions', short: 'Expenses', icon: Receipt },
  { to: '/income', label: 'Income', short: 'Income', icon: TrendingUp },
  { to: '/accounts', label: 'Accounts', short: 'Accounts', icon: Landmark },
  { to: '/analytics', label: 'Analytics', short: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', short: 'Settings', icon: Settings },
]

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
        <Wallet className="h-4 w-4" />
      </span>
      <span className="text-base font-semibold tracking-tight">MyMoney</span>
    </div>
  )
}

function ThemeButton({ className = '' }) {
  const { theme, toggleTheme } = useStore()
  const Icon = theme === 'dark' ? Sun : Moon
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={className}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden lg:inline">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
    </button>
  )
}

function LogoutButton({ className = '' }) {
  const { logout } = useAuth()
  return (
    <button type="button" onClick={logout} className={className} aria-label="Log out">
      <LogOut className="h-4 w-4" />
      <span className="hidden lg:inline">Log out</span>
    </button>
  )
}

export default function Layout({ children }) {
  const { user } = useAuth()
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white px-3 py-5 dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <div className="px-2 pb-6">
          <Logo />
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
          {user && (
            <div className="mb-2 min-w-0 px-3">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
          )}
          <ThemeButton className="btn-ghost w-full justify-start gap-3 px-3" />
          <LogoutButton className="btn-ghost w-full justify-start gap-3 px-3" />
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
        <Logo />
        <div className="flex items-center">
          <ThemeButton className="icon-btn" />
          <LogoutButton className="icon-btn" />
        </div>
      </header>

      <main className="lg:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-10">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:hidden">
        {nav.map(({ to, short, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2 text-[10px] font-medium ${
                isActive
                  ? 'text-slate-900 dark:text-slate-100'
                  : 'text-slate-500 dark:text-slate-500'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {short}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
