import { ArrowUpRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchPrimeOpportunities } from '../services/primeOpportunities'

export default function PrimeOpportunitiesSection() {
  const { data, isError, isPending } = useQuery({
    queryKey: ['prime-opportunities'],
    queryFn: fetchPrimeOpportunities,
    refetchInterval: 24 * 60 * 60 * 1000,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  })

  const opportunities = data?.slice(0, 3) ?? []

  return (
    <section className="opportunity-spotlight" aria-label="Prime opportunities">
      <div className="opportunity-header">
        <h2>Current opportunities</h2>
      </div>

      {isPending ? (
        <div className="opportunity-status">Scanning the market for your strongest matches…</div>
      ) : isError ? (
        <div className="opportunity-status">We couldn’t load the latest prime opportunities right now.</div>
      ) : opportunities.length === 0 ? (
        <div className="opportunity-status">No opportunities are available at the moment.</div>
      ) : (
        <div className="opportunity-list">
          {opportunities.map((opportunity, index) => (
            <a
              key={opportunity.job_id}
              className="opportunity-card"
              href={`/jobs/${opportunity.job_id}?view=applications`}
            >
              <span className="opportunity-rank">0{index + 1}</span>
              <div className="opportunity-card-body">
                <div className="opportunity-card-topline">
                  <span className="opportunity-score-tag">Opportunity</span>
                </div>
                <span className="opportunity-rating">{opportunity.rating}</span>
                <h3>{opportunity.headline}</h3>
                <p>{opportunity.employer}</p>
              </div>
              <span className="opportunity-link" aria-hidden="true">
                <ArrowUpRight size={15} />
              </span>
            </a>
          ))}
        </div>
      )}
    </section>
  )
}
