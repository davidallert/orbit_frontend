import { Activity, BriefcaseBusiness, FileText, Search, Target } from 'lucide-react'
import type { Metrics } from '../types/metrics'
import MetricCountCard from './MetricCountCard'
import OccupationBreakdown from './OccupationBreakdown'
import ScoreMetricCard from './ScoreMetricCard'

type MetricsGridProps = {
  isPending: boolean
  metrics?: Metrics
}

export default function MetricsGrid({ isPending, metrics }: MetricsGridProps) {
  return (
    <>
      <section className="metric-grid expanded-metric-grid" aria-label="Job search metrics">
        <MetricCountCard
          caption="Collected job records"
          icon={BriefcaseBusiness}
          isPending={isPending}
          label="JOBS COLLECTED"
          value={metrics?.job.count}
          iconClass="mint-icon"
        />
        <MetricCountCard
          caption="Distinct job titles searched"
          icon={Search}
          isPending={isPending}
          label="TITLES SEARCHED"
          value={metrics?.title.count}
          iconClass="violet-icon"
        />
        <MetricCountCard
          caption="Cover letters generated for jobs scoring 40+"
          icon={FileText}
          isPending={isPending}
          label="COVER LETTERS"
          value={metrics?.application.count}
          iconClass="amber-icon"
        />
        <ScoreMetricCard
          average={metrics?.job.average_rating}
          icon={Target}
          isPending={isPending}
          label="JOB FIT SCORE"
          maximum={metrics?.job.max_rating}
          minimum={metrics?.job.min_rating}
        />
        <ScoreMetricCard
          average={metrics?.application.average_rating}
          caption="Average for jobs scoring 40+"
          icon={Activity}
          isPending={isPending}
          label="APPLICATION FIT SCORE"
          maximum={metrics?.application.max_rating}
          minimum={metrics?.application.min_rating}
        />
        <OccupationBreakdown isPending={isPending} metrics={metrics?.job} />
      </section>
      <section className="score-guide" aria-label="Fit score guide">
        <span className="score-guide-title">SCORE GUIDE</span>
        <span><strong>0–20</strong> Major mismatch</span>
        <span><strong>21–40</strong> Weak fit</span>
        <span><strong>41–60</strong> Partial fit</span>
        <span><strong>61–80</strong> Good fit</span>
        <span><strong>81–100</strong> Very strong fit</span>
      </section>
    </>
  )
}
