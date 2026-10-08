import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Database, FileText, RefreshCw, Search, Tags } from 'lucide-react'
import { applicationsUrl, fetchApplications, fetchJobs, jobsUrl } from '../services/dataFeed'
import { fetchTitles, titlesUrl } from '../services/titles'
import type { FeedApplication, FeedJob } from '../types/dataFeed'

type DataTab = 'titles' | 'jobs' | 'applications'
type DataFeedPageProps = {
  onSourceChange: (url: string) => void
}

const tabs: { id: DataTab; label: string; icon: typeof Tags }[] = [
  { id: 'titles', label: 'Titles', icon: Tags },
  { id: 'jobs', label: 'Jobs', icon: Database },
  { id: 'applications', label: 'Applications', icon: FileText },
]

function matchingText(values: Array<string | null | undefined>, search: string): boolean {
  const normalizedSearch = search.trim().toLocaleLowerCase()
  return !normalizedSearch || values.some((value) => value?.toLocaleLowerCase().includes(normalizedSearch))
}

function formatDeadline(deadline: string | null): string {
  if (!deadline) return '—'
  const date = new Date(deadline)
  return Number.isNaN(date.getTime()) ? deadline : date.toLocaleDateString()
}

function JobTable({ jobs, search }: { jobs: FeedJob[]; search: string }) {
  const rows = jobs.filter((job) => matchingText([
    String(job.job_id),
    job.headline,
    job.employer,
    job.municipality,
    job.rating,
  ], search))

  return (
    <>
      <div className="data-table-shell" id="data-feed-panel" role="tabpanel" aria-labelledby="data-tab-jobs">
        <table className="data-table jobs-data-table">
          <thead>
            <tr>
              <th scope="col">JOB ID</th>
              <th scope="col">JOB</th>
              <th scope="col">EMPLOYER</th>
              <th scope="col">LOCATION</th>
              <th scope="col">FIT</th>
              <th scope="col">DEADLINE</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((job, index) => (
              <tr key={`${job.job_id}-${index}`}>
                <td className="data-row-number"><a className="data-id-link" href={`/jobs/${job.job_id}`}>{job.job_id}</a></td>
                <td className="data-title-cell">
                  <span className="data-title-marker" />
                  <a className="data-record-link" href={`/jobs/${job.job_id}`}>{job.headline ?? 'Title unavailable'}</a>
                </td>
                <td>{job.employer ?? '—'}</td>
                <td>{job.municipality ?? '—'}</td>
                <td>{job.rating === null ? '—' : <span className="data-rating">{job.rating}</span>}</td>
                <td>{formatDeadline(job.deadline)}</td>
              </tr>
            )) : <tr><td className="data-table-loading" colSpan={6}>{search ? 'No jobs match your filter.' : 'No jobs have been added yet.'}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="data-table-footer">
        <span>Showing {rows.length.toLocaleString()} of {jobs.length.toLocaleString()} jobs</span>
        <span>Open any row to view job details</span>
      </div>
    </>
  )
}

function ApplicationTable({ applications, search }: { applications: FeedApplication[]; search: string }) {
  const rows = applications.filter((application) => matchingText([
    application.job_id === null ? null : String(application.job_id),
    application.headline,
    application.employer,
    application.rating,
    application.applied ? 'applied' : 'not applied',
  ], search))

  return (
    <>
      <div className="data-table-shell" id="data-feed-panel" role="tabpanel" aria-labelledby="data-tab-applications">
        <table className="data-table applications-data-table">
          <thead>
            <tr>
              <th scope="col">JOB ID</th>
              <th scope="col">JOB</th>
              <th scope="col">EMPLOYER</th>
              <th scope="col">FIT</th>
              <th scope="col">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((application, index) => (
              <tr key={`${application.job_id}-${index}`}>
                <td className="data-row-number">
                  {application.job_id === null
                    ? '—'
                    : <a className="data-id-link" href={`/jobs/${application.job_id}`}>{application.job_id}</a>}
                </td>
                <td className="data-title-cell">
                  <span className="data-title-marker" />
                  {application.job_id === null
                    ? <span>{application.headline ?? 'Job details unavailable'}</span>
                    : <a className="data-record-link" href={`/jobs/${application.job_id}`}>{application.headline ?? 'Title unavailable'}</a>}
                </td>
                <td>{application.employer ?? '—'}</td>
                <td>{application.rating === null ? '—' : <span className="data-rating">{application.rating}</span>}</td>
                <td><span className={`application-status${application.applied ? ' applied' : ''}`}>{application.applied ? 'Applied' : 'Not applied'}</span></td>
              </tr>
            )) : <tr><td className="data-table-loading" colSpan={5}>{search ? 'No applications match your filter.' : 'No applications have been recorded yet.'}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="data-table-footer">
        <span>Showing {rows.length.toLocaleString()} of {applications.length.toLocaleString()} applications</span>
        <span>Open any row to view the linked job</span>
      </div>
    </>
  )
}

export default function DataFeedPage({ onSourceChange }: DataFeedPageProps) {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<DataTab>('titles')
  const titlesQuery = useQuery({
    queryKey: ['workflow-titles', titlesUrl],
    queryFn: fetchTitles,
    staleTime: 60_000,
    retry: 1,
  })
  const jobsQuery = useQuery({
    queryKey: ['workflow-jobs', jobsUrl],
    queryFn: fetchJobs,
    staleTime: 60_000,
    retry: 1,
  })
  const applicationsQuery = useQuery({
    queryKey: ['workflow-applications', applicationsUrl],
    queryFn: fetchApplications,
    staleTime: 60_000,
    retry: 1,
  })

  const filteredTitles = useMemo(
    () => (titlesQuery.data ?? []).filter((title) => matchingText([title], search)),
    [search, titlesQuery.data],
  )
  const activeQuery = activeTab === 'titles' ? titlesQuery : activeTab === 'jobs' ? jobsQuery : applicationsQuery
  const activeCount = activeTab === 'titles'
    ? titlesQuery.data?.length
    : activeTab === 'jobs'
      ? jobsQuery.data?.length
      : applicationsQuery.data?.length
  const activeLabel = tabs.find(({ id }) => id === activeTab)?.label ?? 'Records'

  return (
    <section className="data-feed-page">
      <header className="data-feed-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> YOUR WORKFLOW RECORDS</div>
          <h1>Data feed</h1>
          <p>Browse the search titles, job listings, and applications connected to your workflow.</p>
        </div>
        <div className="data-feed-total">
          <span>{activeLabel.toUpperCase()}</span>
          <strong>{activeQuery.isPending ? '—' : activeCount?.toLocaleString() ?? '—'}</strong>
          <small>{activeTab === 'titles' ? 'tracked in your workflow' : `records in the ${activeLabel.toLowerCase()} feed`}</small>
        </div>
      </header>

      <div className="data-feed-toolbar">
        <div className="data-tabs" role="tablist" aria-label="Data type">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              aria-selected={activeTab === id}
              aria-controls="data-feed-panel"
              id={`data-tab-${id}`}
              className={`data-tab${activeTab === id ? ' active' : ''}`}
              key={id}
              role="tab"
              type="button"
              onClick={() => {
                setSearch('')
                setActiveTab(id)
                onSourceChange(id === 'titles' ? titlesUrl : id === 'jobs' ? jobsUrl : applicationsUrl)
              }}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <div className="data-feed-actions">
          <label className="data-search">
            <Search size={14} aria-hidden="true" />
            <input
              type="search"
              aria-label={`Filter ${activeLabel.toLowerCase()}`}
              placeholder={`Filter ${activeLabel.toLowerCase()}`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <button
            className="data-refresh"
            type="button"
            aria-label={`Refresh ${activeLabel.toLowerCase()}`}
            title={`Refresh ${activeLabel.toLowerCase()}`}
            disabled={activeQuery.isFetching}
            onClick={() => void activeQuery.refetch()}
          >
            <RefreshCw size={14} className={activeQuery.isFetching ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {activeQuery.isError ? (
        <div className="data-feed-message error" role="alert">
          <strong>Couldn’t load {activeLabel.toLowerCase()}.</strong>
          <span>{activeQuery.error.message}</span>
          <button type="button" onClick={() => void activeQuery.refetch()}>Try again</button>
        </div>
      ) : activeQuery.isPending ? (
        <div className="data-table-shell" id="data-feed-panel" role="tabpanel" aria-labelledby={`data-tab-${activeTab}`}>
          <table className="data-table">
            <tbody><tr><td className="data-table-loading">Loading {activeLabel.toLowerCase()}…</td></tr></tbody>
          </table>
        </div>
      ) : activeTab === 'titles' ? (
        <>
          <div className="data-table-shell" id="data-feed-panel" role="tabpanel" aria-labelledby="data-tab-titles">
            <table className="data-table titles-data-table">
              <thead><tr><th scope="col">#</th><th scope="col">TITLE</th></tr></thead>
              <tbody>
                {filteredTitles.length ? filteredTitles.map((title, index) => (
                  <tr key={`${title}-${index}`}>
                    <td className="data-row-number">{index + 1}</td>
                    <td className="data-title-cell"><span className="data-title-marker" />{title}</td>
                  </tr>
                )) : (
                  <tr><td className="data-table-loading" colSpan={2}>{search ? 'No titles match your filter.' : 'No titles have been added yet.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="data-table-footer">
            <span>Showing {filteredTitles.length.toLocaleString()} of {(titlesQuery.data?.length ?? 0).toLocaleString()} titles</span>
            <span>Source · n8n titles feed</span>
          </div>
        </>
      ) : activeTab === 'jobs' ? (
        <JobTable jobs={jobsQuery.data ?? []} search={search} />
      ) : (
        <ApplicationTable applications={applicationsQuery.data ?? []} search={search} />
      )}
    </section>
  )
}
