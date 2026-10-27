import {
  Activity, CircleHelp, LayoutDashboard, LogOut, Package,
  Settings, ShoppingCart, TicketPercent, Users,
} from 'lucide-react'
import type { Page } from '../types'

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Customers', icon: Users },
  { label: 'Products', icon: Package },
  { label: 'Orders', icon: ShoppingCart },
  { label: 'Analytics', icon: Activity },
  { label: 'Discounts', icon: TicketPercent },
] as const

type Props = {
  page: Page
  setPage: (page: Page) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  adminName: string
  onLogout: () => void
}

export default function Sidebar({ page, setPage, sidebarOpen, setSidebarOpen, adminName, onLogout }: Props) {
  return (
    <>
      {sidebarOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <a className="brand sidebar-brand" href="#" onClick={(event) => event.preventDefault()}>Ràtech<span>.</span></a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="sidebar-nav">
          {navigation.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${page === label ? 'nav-item--active' : ''}`} onClick={() => { setPage(label); setSidebarOpen(false) }}>
              <Icon size={19} strokeWidth={1.8} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => setPage('Dashboard')}><Settings size={19} /><span>Settings</span></button>
          <button className="nav-item" onClick={() => setPage('Dashboard')}><CircleHelp size={19} /><span>Help &amp; support</span></button>
          <div className="sidebar-profile">
            <div className="avatar">{adminName.charAt(0).toUpperCase()}</div>
            <div className="profile-copy"><strong>{adminName}</strong><span>Administrator</span></div>
            <button className="icon-button profile-logout" aria-label="Log out" onClick={onLogout}><LogOut size={17} /></button>
          </div>
        </div>
      </aside>
    </>
  )
}
