import {
  BriefcaseBusiness,
  LayoutDashboard,
  Satellite,
  Zap,
} from 'lucide-react'

type SidebarProps = {
  activePage: 'overview' | 'workflow' | 'feed'
}

export default function Sidebar({ activePage }: SidebarProps) {
  return (
    <aside className="sidebar">
      <a className="brand" href="/" aria-label="Orbit home">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="5.5" />
            <ellipse cx="16" cy="16" rx="13" ry="6.2" transform="rotate(-32 16 16)" />
            <circle className="brand-satellite" cx="25.7" cy="9" r="1.8" />
          </svg>
        </span>
        <span>orbit<span className="brand-period">.</span></span>
      </a>

      <div className="workspace-switcher">
        <div className="workspace-icon"><BriefcaseBusiness size={15} /></div>
        <div className="workspace-copy"><strong>Dashboard</strong><span>Personal workspace</span></div>
      </div>

      <div className="nav-label">WORKSPACE</div>
      <nav className="main-nav" aria-label="Main navigation">
        <a className={`nav-item ${activePage === 'overview' ? 'active' : 'muted-link'}`} href="/">
          <LayoutDashboard size={17} /><span>Overview</span>{activePage === 'overview' && <span className="nav-active-dot" />}
        </a>
        <a className={`nav-item ${activePage === 'workflow' ? 'active' : 'muted-link'}`} href="/workflow">
          <Zap size={17} /><span>Workflow</span>{activePage === 'workflow' && <span className="nav-active-dot" />}
        </a>
        <a className={`nav-item ${activePage === 'feed' ? 'active' : 'muted-link'}`} href="/feed">
          <Satellite size={17} /><span>Data feed</span>{activePage === 'feed' && <span className="nav-active-dot" />}
        </a>
      </nav>

      <div className="nav-label integrations-label">Workflow</div>
      <div className="automation-card">
        <span className="automation-mark" aria-hidden="true"><i /><i /><i /></span>
        <span className="automation-copy"><strong>Method</strong><small>Discover · score · draft</small></span>
      </div>

      <div className="sidebar-bottom">
        <div className="sidebar-note"><span>ORBIT DASHBOARD</span><span>Launch your career.</span></div>
        <div className="profile-row">
          <div className="avatar">D</div>
          <div><strong>David</strong><span>Active user</span></div>
        </div>
      </div>
    </aside>
  )
}
