import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import DashboardIntro from './components/DashboardIntro'
import MetricsGrid from './components/MetricsGrid'
import Sidebar from './components/Sidebar'
import SpaceEffects from './components/SpaceEffects'
import TopBar from './components/TopBar'
import WorkflowPanels from './components/WorkflowPanels'
import { fetchMetrics, metricsUrl } from './services/metrics'
import type { Metrics } from './types/metrics'
import type { VisualMode } from './types/visualMode'
import './styles/app.css'

function App() {
  const [visualMode, setVisualMode] = useState<VisualMode>(() =>
    window.matchMedia('(max-width: 760px), (pointer: coarse)').matches ? 'performance' : 'power',
  )
  const powerModeEnabled = visualMode === 'power'
  const query = useQuery({
    queryKey: ['workflow-metrics', metricsUrl],
    queryFn: fetchMetrics,
    refetchInterval: 24 * 60 * 60 * 1_000,
    staleTime: 30_000,
    retry: 1,
  })

  const metrics: Metrics | undefined = query.data

  return (
    <div className={`app-shell ${visualMode}-mode`}>
      <SpaceEffects key={visualMode} powerModeEnabled={powerModeEnabled} />
      <Sidebar />
      <main className="main-content" id="overview">
        <TopBar
          mode={visualMode}
          isError={query.isError}
          onToggleMode={() => setVisualMode((mode) => mode === 'power' ? 'performance' : 'power')}
        />
        <div className="page-wrap">
          <DashboardIntro
            errorMessage={query.isError ? query.error.message : undefined}
            isFetching={query.isFetching}
            metrics={metrics}
            onRefresh={() => void query.refetch()}
          />
          <MetricsGrid isPending={query.isPending} metrics={metrics} />
          <WorkflowPanels
            isError={query.isError}
            isFetching={query.isFetching}
            isPending={query.isPending}
            metrics={metrics}
          />
          <footer className="page-footer">
            <span>Orbit · Job search workspace</span>
            <span>Metrics refresh once a day</span>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App
