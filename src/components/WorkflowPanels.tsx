import type { Metrics } from '../types/metrics'
import { metricsEndpoint } from '../services/metrics'
import { formatDate } from '../utils/formatDate'

type WorkflowPanelsProps = {
  isError: boolean
  isFetching: boolean
  isPending: boolean
  metrics?: Metrics
}

export default function WorkflowPanels({
  isError,
  isFetching,
  isPending,
  metrics,
}: WorkflowPanelsProps) {
  const receiptLabel = isError
    ? 'LAST REQUEST'
    : isFetching
      ? 'REQUEST IN PROGRESS'
      : isPending
        ? 'AWAITING FIRST RESPONSE'
        : 'LAST RESPONSE'
  const receiptStatus = isError
    ? 'Unable to connect'
    : isFetching
      ? 'Refreshing metrics'
      : isPending
        ? 'Waiting for data'
        : 'Received successfully'

  return (
    <section className="lower-grid">
      <div className="card-shadow-shell">
        <article className="panel insight-panel" id="workflow">
          <div className="panel-heading">
            <div><span className="section-kicker">THE PROCESS</span><h2>Three stages, one workflow</h2></div>
            <span className="panel-index">01 — 03</span>
          </div>
          <div className="flow-steps">
            <div className="flow-step">
              <span className="flow-index">01</span>
              <div className="flow-copy"><strong>Discover</strong><span>New listings enter the feed</span></div>
            </div>
            <span className="flow-connector" />
            <div className="flow-step">
              <span className="flow-index">02</span>
              <div className="flow-copy"><strong>Score</strong><span>Ranked by fit</span></div>
            </div>
            <span className="flow-connector" />
            <div className="flow-step">
              <span className="flow-index">03</span>
              <div className="flow-copy"><strong>Draft</strong><span>CV tailored to the role</span></div>
            </div>
          </div>
          <div className="panel-note">
            <span>Each listing moves from discovery to a CV draft through your n8n workflow.</span>
          </div>
        </article>
      </div>

      <div className="card-shadow-shell">
        <article className="panel sync-panel" id="feed">
          <div className="panel-heading">
            <div><span className="section-kicker">DATA FEED</span><h2>n8n metrics endpoint</h2></div>
            <span className={`connection-check ${isError ? 'offline' : ''}`} aria-label={isError ? 'Disconnected' : 'Connected'}>
              <span />
            </span>
          </div>
          <div className="feed-receipt">
            <span className="feed-receipt-label">{receiptLabel}</span>
            <strong>{receiptStatus}</strong>
            <time>{formatDate(metrics?.updatedAt)}</time>
          </div>
          <div className="sync-url">
            <span className="url-method">GET</span>
            <code>{metricsEndpoint.pathname}</code>
            <span className="feed-host">{metricsEndpoint.host}</span>
          </div>
        </article>
      </div>
    </section>
  )
}
