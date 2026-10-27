import { Bell, ChevronDown, ChevronRight, Menu, Search } from 'lucide-react'
import type { Page } from '../types'

type Props = {
  page: Page
  adminName: string
  search: string
  setSearch: (value: string) => void
  onMenu: () => void
}

export default function Topbar({ page, adminName, search, setSearch, onMenu }: Props) {
  return (
    <header className="topbar">
      <button className="icon-button mobile-menu-button" aria-label="Open navigation" onClick={onMenu}><Menu size={21} /></button>
      <div className="breadcrumb"><span>Ràtech</span><ChevronRight size={15} /><strong>{page}</strong></div>
      <div className="topbar-actions">
        <label className="global-search"><Search size={17} /><input placeholder="Search..." value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>/</kbd></label>
        <button className="icon-button notification-button" aria-label="Notifications"><Bell size={19} /><span /></button>
        <div className="topbar-divider" />
        <div className="topbar-user">
          <div className="avatar">{adminName.charAt(0).toUpperCase()}</div>
          <div className="topbar-user-copy"><strong>{adminName}</strong><span>Administrator</span></div>
          <ChevronDown size={15} />
        </div>
      </div>
    </header>
  )
}
