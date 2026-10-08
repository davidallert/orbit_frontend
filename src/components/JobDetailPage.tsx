import { ArrowLeft, BriefcaseBusiness, FileText } from 'lucide-react'

type JobDetailPageProps = {
  jobId: string
}

export default function JobDetailPage({ jobId }: JobDetailPageProps) {
  return (
    <section className="job-detail-page">
      <a className="job-detail-back" href="/feed">
        <ArrowLeft size={14} />
        <span>Back to data feed</span>
      </a>

      <header className="job-detail-heading">
        <span className="job-detail-icon"><BriefcaseBusiness size={18} /></span>
        <div>
          <span className="section-kicker">JOB RECORD</span>
          <h1>Job details</h1>
          <p>Full listing information and formatted description will appear here.</p>
        </div>
      </header>

      <div className="job-detail-placeholder">
        <span className="job-detail-placeholder-icon"><FileText size={20} /></span>
        <span className="section-kicker">DETAIL WEBHOOK PENDING</span>
        <h2>Job {jobId}</h2>
        <p>
          This page is ready for the dedicated job-details webhook, including the formatted
          description and the rest of the listing data.
        </p>
        <div className="job-detail-id">
          <span>SHARED JOB ID</span>
          <code>{jobId}</code>
        </div>
      </div>
    </section>
  )
}
