import {
  Activity,
  BriefcaseBusiness,
  LayoutDashboard,
  Satellite,
  Zap,
} from 'lucide-react'

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <a className="brand" href="#overview" aria-label="Orbit home">
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
        <div className="workspace-copy"><strong>Job search</strong><span>Personal workspace</span></div>
      </div>

      <div className="nav-label">WORKSPACE</div>
      <nav className="main-nav" aria-label="Main navigation">
        <a className="nav-item active" href="#overview">
          <LayoutDashboard size={17} /><span>Overview</span><span className="nav-active-dot" />
        </a>
        <a className="nav-item muted-link" href="#signals"><Activity size={17} /><span>Search signals</span></a>
        <a className="nav-item muted-link" href="#workflow"><Zap size={17} /><span>Workflow</span></a>
        <a className="nav-item muted-link" href="#feed"><Satellite size={17} /><span>Data feed</span></a>
      </nav>

      <div className="nav-label integrations-label">RUN PROFILE</div>
      <div className="automation-card">
        <span className="automation-mark" aria-hidden="true"><i /><i /><i /></span>
        <span className="automation-copy"><strong>Job intelligence</strong><small>Discover · score · draft</small></span>
      </div>

      <div className="sidebar-bottom">
        <div className="sidebar-note"><span>ORBIT / JOB SEARCH</span><span>One feed. Three useful steps.</span></div>
        <div className="profile-row">
          <div className="avatar">D</div>
          <div><strong>David</strong><span>Job search workspace</span></div>
        </div>
      </div>
    </aside>
  )
}
