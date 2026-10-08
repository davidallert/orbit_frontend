import { Pause, Play } from 'lucide-react'
import { metricsEndpoint } from '../services/metrics'
import type { VisualMode } from '../types/visualMode'

type TopBarProps = {
  mode: VisualMode
  isError: boolean
  onToggleMode: () => void
}

export default function TopBar({ mode, isError, onToggleMode }: TopBarProps) {
  const powerModeEnabled = mode === 'power'
  const nextModeLabel = powerModeEnabled ? 'Performance' : 'Power'

  return (
    <header className="topbar">
      <div className="breadcrumbs">
        <span>ORBIT</span><span className="crumb-slash">/</span><strong>JOB INTELLIGENCE</strong>
      </div>
      <div className="topbar-tools">
        <button
          className="mode-toggle"
          type="button"
          aria-label={`${mode} mode`}
          aria-pressed={powerModeEnabled}
          title={`Switch to ${nextModeLabel} mode`}
          onClick={onToggleMode}
        >
          {powerModeEnabled ? <Pause size={13} /> : <Play size={13} />}
          <span>{mode === 'power' ? 'Power mode' : 'Performance mode'}</span>
        </button>
        <div className="topbar-source">
          <span className={`source-led ${isError ? 'offline' : ''}`} />
          <span>n8n feed</span>
          <code>{metricsEndpoint.host}{metricsEndpoint.pathname}</code>
        </div>
      </div>
    </header>
  )
}
