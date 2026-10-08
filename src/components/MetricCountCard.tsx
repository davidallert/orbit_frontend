import type { LucideIcon } from 'lucide-react'

type MetricCountCardProps = {
  caption: string
  icon: LucideIcon
  iconClass: string
  isPending: boolean
  label: string
  value?: number
}

export default function MetricCountCard({
  caption,
  icon: Icon,
  iconClass,
  isPending,
  label,
  value,
}: MetricCountCardProps) {
  return (
    <div className="card-shadow-shell">
      <article className="metric-card data-card">
        <div className="metric-top">
          <span className={`metric-icon ${iconClass}`}><Icon size={16} /></span>
          <span className="metric-label">{label}</span>
        </div>
        <div className="metric-number">
          {isPending ? <span className="skeleton short" /> : value?.toLocaleString() ?? '—'}
        </div>
        <div className="metric-foot"><span className="metric-caption">{caption}</span></div>
      </article>
    </div>
  )
}
