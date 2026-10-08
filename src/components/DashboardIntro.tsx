import { ArrowRight, RefreshCw, Rocket, Satellite } from 'lucide-react'
import type { Metrics } from '../types/metrics'

type DashboardIntroProps = {
  errorMessage?: string
  isFetching: boolean
  metrics?: Metrics
  onRefresh: () => void
}

export default function DashboardIntro({
  errorMessage,
  isFetching,
  metrics,
  onRefresh,
}: DashboardIntroProps) {
  return (
    <>
      <div className="card-shadow-shell">
        <section className="welcome-row">
          <div className="welcome-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> Welcome David</div>
            <h1>Your job data at a glance.</h1>
            <p className="welcome-subtitle">
              The n8n workflow finds roles, scores the fit, and generates cover letters for promising matches.
            </p>
            <button className="refresh-button" onClick={onRefresh} disabled={isFetching}>
              <RefreshCw size={14} className={isFetching ? 'spin' : ''} />
              {isFetching ? 'Syncing metrics' : 'Sync metrics'}
            </button>
          </div>
          <div className="hero-orbit" aria-hidden="true">
            <span className="orbit-label label-one">JOB FEED</span>
            <span className="orbit-label label-two">{metrics?.job.count.toLocaleString() ?? '—'} LISTINGS</span>
            <span className="orbit-path orbit-path-one" />
            <span className="orbit-path orbit-path-two" />
            <span className="orbit-path orbit-path-three" />
            <span className="earth-atmosphere" />
            <span className="orbit-planet earth-planet">
              <svg className="earth-map" viewBox="0 0 100 100" aria-hidden="true">
                <path d="M14 25 21 17l11 2 5 7 9 1 4 7-8 5-1 9-7 2-5 12-8-2-3-10-7-4-5-11 3-10Zm47-10 9-4 11 4 2 7 10 5-4 9-8 3-2 10-8 2-4-9-7-3 1-10-6-7 6-7Zm-9 36 10 1 9 8-1 8-6 3-2 11-8 8-6-5 2-10-5-8 2-8-5-5Zm31 10 8 1 4 6-5 5-7-3Z" fill="currentColor" />
              </svg>
              <span className="earth-cloud cloud-a" />
              <span className="earth-cloud cloud-b" />
              <span className="earth-glint" />
            </span>
            <span className="orbit-moon moon-one" />
            <span className="orbit-satellite moon-two"><Satellite size={14} strokeWidth={1.7} /></span>
            <span className="orbit-rocket"><Rocket size={18} strokeWidth={1.7} /></span>
            <span className="orbit-star star-one" />
            <span className="orbit-star star-two" />
            <span className="orbit-star star-three" />
            <span className="orbit-star star-four" />
          </div>
        </section>
      </div>

      {errorMessage && (
        <div className="error-banner" role="alert">
          <div>
            <strong>We couldn’t reach your metrics workflow.</strong>
            <span>{errorMessage} Check that n8n is running and allows requests from this page.</span>
          </div>
          <button onClick={onRefresh}>Try again <ArrowRight size={14} /></button>
        </div>
      )}

      <section className="section-heading" id="signals">
        <div><span className="section-kicker">SEARCH STATISTICS</span><h2>The dataset</h2></div>
        <p className="section-caption">From the latest n8n response</p>
      </section>
    </>
  )
}
