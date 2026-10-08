import { Pause, Play } from 'lucide-react'
import { metricsEndpoint } from '../services/metrics'

type TopBarProps = {
  animationsEnabled: boolean
  isError: boolean
  onToggleAnimations: () => void
}

export default function TopBar({ animationsEnabled, isError, onToggleAnimations }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="breadcrumbs">
        <span>ORBIT</span><span className="crumb-slash">/</span><strong>JOB INTELLIGENCE</strong>
      </div>
      <div className="topbar-tools">
        <button
          className="motion-toggle"
          type="button"
          aria-label={animationsEnabled ? 'Turn animations off' : 'Turn animations on'}
          aria-pressed={!animationsEnabled}
          title={animationsEnabled ? 'Turn animations off' : 'Turn animations on'}
          onClick={onToggleAnimations}
        >
          {animationsEnabled ? <Pause size={13} /> : <Play size={13} />}
          <span>{animationsEnabled ? 'Motion on' : 'Motion off'}</span>
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
