import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import DashboardIntro from './components/DashboardIntro'
import DataFeedPage from './components/DataFeedPage'
import JobDetailPage from './components/JobDetailPage'
import MetricsGrid from './components/MetricsGrid'
import Sidebar from './components/Sidebar'
import SpaceEffects from './components/SpaceEffects'
import TopBar from './components/TopBar'
import WorkflowPage from './components/WorkflowPage'
import WorkflowPanels from './components/WorkflowPanels'
import { fetchMetrics, metricsUrl } from './services/metrics'
import { jobsUrl } from './services/dataFeed'
import { titlesUrl } from './services/titles'
import type { Metrics } from './types/metrics'
import type { VisualMode } from './types/visualMode'
import './styles/app.css'

function App() {
  const [visualMode, setVisualMode] = useState<VisualMode>(() => {
    const savedMode = window.sessionStorage.getItem('orbit-visual-mode')
    if (savedMode === 'power' || savedMode === 'performance') return savedMode
    return window.matchMedia('(max-width: 760px), (pointer: coarse)').matches ? 'performance' : 'power'
  })
  const powerModeEnabled = visualMode === 'power'
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/'
  const isWorkflowPage = pathname === '/workflow'
  const isDataFeedPage = pathname === '/feed'
  const jobDetailMatch = pathname.match(/^\/jobs\/([^/]+)$/)
  const isJobDetailPage = jobDetailMatch !== null
  const jobId = jobDetailMatch?.[1]
  const isFeedPage = isDataFeedPage || isJobDetailPage
  const [feedSourceUrl, setFeedSourceUrl] = useState(titlesUrl)

  useEffect(() => {
    window.sessionStorage.setItem('orbit-visual-mode', visualMode)
  }, [visualMode])

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
      <Sidebar activePage={isWorkflowPage ? 'workflow' : isFeedPage ? 'feed' : 'overview'} />
      <main className="main-content" id={isWorkflowPage ? 'workflow-page' : isFeedPage ? 'data-feed' : 'overview'}>
        <TopBar
          mode={visualMode}
          isError={query.isError}
          pageTitle={isWorkflowPage ? 'WORKFLOW' : isFeedPage ? 'DATA FEED' : 'OVERVIEW'}
          sourceUrl={isDataFeedPage ? feedSourceUrl : isJobDetailPage ? jobsUrl : undefined}
          onToggleMode={() => setVisualMode((mode) => mode === 'power' ? 'performance' : 'power')}
        />
        <div className="page-wrap">
          {isWorkflowPage ? (
            <WorkflowPage />
          ) : isJobDetailPage && jobId ? (
            <JobDetailPage jobId={jobId} />
          ) : isDataFeedPage ? (
            <DataFeedPage onSourceChange={setFeedSourceUrl} />
          ) : (
            <>
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
            </>
          )}
          <footer className="page-footer">
            <span>Orbit · Job search workspace</span>
            <span>
              {isWorkflowPage
                ? 'Workflow starts manually in n8n'
                : isFeedPage
                  ? 'More data views coming soon'
                  : 'Metrics refresh once a day'}
            </span>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App
