import { Activity, BriefcaseBusiness, Target } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { Metrics } from '../types/metrics'

type MetricsGridProps = {
  isPending: boolean
  metrics?: Metrics
}

export default function MetricsGrid({ isPending, metrics }: MetricsGridProps) {
  const ratingPercent = Math.min(100, Math.max(0, metrics?.average_rating ?? 0))
  const rangeStyle = {
    '--range-low': `${Math.min(100, Math.max(0, metrics?.min_rating ?? 0))}%`,
    '--range-high': `${Math.min(100, Math.max(0, metrics?.max_rating ?? 100))}%`,
  } as CSSProperties

  return (
    <section className="metric-grid" aria-label="Job search metrics">
      <div className="card-shadow-shell">
        <article className="metric-card jobs-card">
          <div className="metric-top">
            <span className="metric-icon mint-icon"><BriefcaseBusiness size={16} /></span>
            <span className="metric-label">UNIQUE LISTINGS</span>
          </div>
          <div className="metric-number">
            {isPending ? <span className="skeleton short" /> : metrics?.unique_count_job_id.toLocaleString() ?? '—'}
          </div>
          <div className="metric-foot"><span className="metric-caption">Distinct job IDs in the feed</span></div>
        </article>
      </div>

      <div className="card-shadow-shell">
        <article className="metric-card rating-card">
          <div className="metric-top">
            <span className="metric-icon violet-icon"><Target size={16} /></span>
            <span className="metric-label">AVERAGE FIT SCORE</span>
          </div>
          <div className="metric-number">
            {isPending ? <span className="skeleton short" /> : metrics?.average_rating.toFixed(1) ?? '—'}
            <span className="out-of">/ 100</span>
          </div>
          <div className="rating-track" role="meter" aria-label="Average fit score" aria-valuemin={0} aria-valuemax={100} aria-valuenow={ratingPercent}>
            <span style={{ width: `${ratingPercent}%` }} />
          </div>
          <div className="metric-foot"><span className="metric-caption">Mean score across listings</span></div>
        </article>
      </div>

      <div className="card-shadow-shell metric-range-shell">
        <article className="metric-card range-card">
          <div className="metric-top">
            <span className="metric-icon amber-icon"><Activity size={16} /></span>
            <span className="metric-label">SCORE SPREAD</span>
          </div>
          <div className="range-values">
            <div>
              <span className="range-label">LOWEST</span>
              <strong>{isPending ? '—' : metrics?.min_rating ?? '—'}</strong>
            </div>
            <span className="range-dash" />
            <div>
              <span className="range-label">HIGHEST</span>
              <strong>{isPending ? '—' : metrics?.max_rating ?? '—'}</strong>
            </div>
          </div>
          <div className="metric-foot"><span className="metric-caption">Fit scores across the feed</span></div>
          <div className="range-track" style={rangeStyle}>
            <span className="range-dot low" />
            <span className="range-fill" />
            <span className="range-dot high" />
          </div>
        </article>
      </div>
    </section>
  )
}
