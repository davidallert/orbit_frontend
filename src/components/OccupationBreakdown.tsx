import { Layers3 } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { JobMetrics } from '../types/metrics'

type OccupationBreakdownProps = {
  isPending: boolean
  metrics?: JobMetrics
}

export default function OccupationBreakdown({ isPending, metrics }: OccupationBreakdownProps) {
  const categories = metrics
    ? [
        { label: 'Occupation', name: metrics.occupation_label, count: metrics.occupation_label_count },
        { label: 'Group', name: metrics.occupation_group, count: metrics.occupation_group_count },
        { label: 'Field', name: metrics.occupation_field, count: metrics.occupation_field_count },
      ]
    : []
  const maximumCount = Math.max(...categories.map(({ count }) => count), 1)

  return (
    <div className="card-shadow-shell">
      <article className="metric-card occupation-card">
        <div className="metric-top">
          <span className="metric-icon mint-icon"><Layers3 size={16} /></span>
          <span className="metric-label">OCCUPATION BREAKDOWN</span>
        </div>
        <div className="occupation-list">
          {categories.map(({ label, name, count }) => (
            <div className="occupation-item" key={label}>
              <div className="occupation-copy">
                <span>{label}</span>
                <strong title={name}>{name}</strong>
              </div>
              <span className="occupation-count">{isPending ? '—' : count.toLocaleString()}</span>
              <span className="occupation-track" aria-hidden="true">
                <span style={{ '--occupation-width': `${count / maximumCount * 100}%` } as CSSProperties} />
              </span>
            </div>
          ))}
          {isPending && <span className="occupation-loading">Loading occupation breakdown</span>}
        </div>
        <div className="metric-foot"><span className="metric-caption">Most common job taxonomy values</span></div>
      </article>
    </div>
  )
}
