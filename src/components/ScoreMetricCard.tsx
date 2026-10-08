import type { LucideIcon } from 'lucide-react'

type ScoreMetricCardProps = {
  average?: number
  caption?: string
  icon: LucideIcon
  isPending: boolean
  label: string
  maximum?: number
  minimum?: number
}

function getScoreBand(score: number) {
  const roundedScore = Math.round(score)
  if (roundedScore <= 20) return { label: 'Major mismatch', tone: 'score-critical' }
  if (roundedScore <= 40) return { label: 'Weak fit', tone: 'score-weak' }
  if (roundedScore <= 60) return { label: 'Partial fit', tone: 'score-partial' }
  if (roundedScore <= 80) return { label: 'Good fit', tone: 'score-good' }
  return { label: 'Very strong fit', tone: 'score-strong' }
}

export default function ScoreMetricCard({
  average,
  caption = 'Average fit · low to high',
  icon: Icon,
  isPending,
  label,
  maximum,
  minimum,
}: ScoreMetricCardProps) {
  const scoreBand = average === undefined ? undefined : getScoreBand(average)
  const scoreWidth = average === undefined ? undefined : `${Math.min(100, Math.max(0, average))}%`

  return (
    <div className="card-shadow-shell">
      <article className="metric-card score-card">
        <div className="metric-top">
          <span className="metric-icon violet-icon"><Icon size={16} /></span>
          <span className="metric-label">{label}</span>
        </div>
        <div className="metric-number">
          {isPending ? <span className="skeleton short" /> : average?.toFixed(1) ?? '—'}
          <span className="out-of">/ 100</span>
        </div>
        <div
          className="score-meter"
          role={average === undefined ? undefined : 'meter'}
          aria-label={average === undefined ? undefined : label}
          aria-valuemin={average === undefined ? undefined : 0}
          aria-valuemax={average === undefined ? undefined : 100}
          aria-valuenow={average}
        >
          <span style={scoreWidth === undefined ? undefined : { width: scoreWidth }} />
        </div>
        <div className="score-card-meta">
          <span className={`score-band ${scoreBand?.tone ?? ''}`}>{isPending ? 'Loading score' : scoreBand?.label ?? 'No score'}</span>
          <span className="score-range">
            {isPending ? '—' : minimum ?? '—'}–{isPending ? '—' : maximum ?? '—'}
          </span>
        </div>
        <div className="metric-foot"><span className="metric-caption">{caption}</span></div>
      </article>
    </div>
  )
}
