import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, ArrowUpDown, Database, FileText, RefreshCw, Search, Tags } from 'lucide-react'
import { applicationsUrl, fetchApplications, fetchJobs, jobsUrl } from '../services/dataFeed'
import { fetchTitles, titlesUrl } from '../services/titles'
import type { FeedApplication, FeedJob } from '../types/dataFeed'

type DataTab = 'titles' | 'jobs' | 'applications'
type SortDirection = 'asc' | 'desc'
type SortState = { key: string; direction: SortDirection } | null
type DataFeedPageProps = {
  onSourceChange: (url: string) => void
}

function numericValue(value: string | null): number | null {
  if (value === null || value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function dateValue(value: string | null): number | null {
  if (!value) return null
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

const tabs: { id: DataTab; label: string; icon: typeof Tags }[] = [
  { id: 'titles', label: 'Titles', icon: Tags },
  { id: 'jobs', label: 'Jobs', icon: Database },
  { id: 'applications', label: 'Applications', icon: FileText },
]

function initialFeedTab(): DataTab {
  const view = new URLSearchParams(window.location.search).get('view')
  return view === 'jobs' || view === 'applications' ? view : 'titles'
}

function jobDetailsHref(jobId: number, view: DataTab): string {
  return `/jobs/${jobId}?view=${view}`
}

function matchingText(values: Array<string | null | undefined>, search: string): boolean {
  const normalizedSearch = search.trim().toLocaleLowerCase()
  return !normalizedSearch || values.some((value) => value?.toLocaleLowerCase().includes(normalizedSearch))
}

function formatDeadline(deadline: string | null): string {
  if (!deadline) return '—'
  const date = new Date(deadline)
  return Number.isNaN(date.getTime()) ? deadline : date.toLocaleDateString()
}

function isDeadlineApproaching(deadline: string | null): boolean {
  if (!deadline) return false
  const timestamp = new Date(deadline).getTime()
  const remaining = timestamp - Date.now()
  return Number.isFinite(timestamp) && remaining >= 0 && remaining <= 7 * 24 * 60 * 60 * 1000
}

function sortRows<T>(
  rows: T[],
  sort: SortState,
  valueFor: (row: T, key: string) => string | number | boolean | null,
): T[] {
  if (!sort) return rows
  const multiplier = sort.direction === 'asc' ? 1 : -1
  return [...rows].sort((left, right) => {
    const leftValue = valueFor(left, sort.key)
    const rightValue = valueFor(right, sort.key)
    if (leftValue === null) return rightValue === null ? 0 : 1
    if (rightValue === null) return -1
    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return (leftValue - rightValue) * multiplier
    }
    if (typeof leftValue === 'boolean' && typeof rightValue === 'boolean') {
      return (Number(leftValue) - Number(rightValue)) * multiplier
    }
    return String(leftValue).localeCompare(String(rightValue), undefined, { numeric: true, sensitivity: 'base' }) * multiplier
  })
}

function SortHeader({
  label,
  field,
  sort,
  onSort,
}: {
  label: string
  field: string
  sort: SortState
  onSort: (field: string) => void
}) {
  const active = sort?.key === field
  const nextDirection = active && sort.direction === 'asc' ? 'descending' : 'ascending'
  return (
    <th scope="col" aria-sort={active ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}>
      <button className="data-sort-button" type="button" onClick={() => onSort(field)}>
        <span>{label}</span>
        {active && (sort.direction === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
        {!active && <ArrowUpDown className="sort-indicator" size={11} aria-hidden="true" />}
        <span className="visually-hidden">{active ? `Sorted ${sort.direction === 'asc' ? 'ascending' : 'descending'}` : `Sort ${nextDirection}`}</span>
      </button>
    </th>
  )
}

function JobTable({
  jobs,
  search,
  sort,
  onSort,
}: {
  jobs: FeedJob[]
  search: string
  sort: SortState
  onSort: (field: string) => void
}) {
  const filteredRows = jobs.filter((job) => matchingText([
    String(job.job_id),
    job.headline,
    job.employer,
    job.municipality,
    job.rating,
  ], search))
  const rows = sortRows(filteredRows, sort, (job, key) => {
    if (key === 'job_id') return job.job_id
    if (key === 'headline') return job.headline
    if (key === 'employer') return job.employer
    if (key === 'municipality') return job.municipality
    if (key === 'rating') return numericValue(job.rating)
    if (key === 'deadline') return dateValue(job.deadline)
    return null
  })

  return (
    <>
      <div className="data-table-shell" id="data-feed-panel" role="tabpanel" aria-labelledby="data-tab-jobs">
        <table className="data-table jobs-data-table">
          <thead>
            <tr>
              <SortHeader label="JOB ID" field="job_id" sort={sort} onSort={onSort} />
              <SortHeader label="JOB" field="headline" sort={sort} onSort={onSort} />
              <SortHeader label="EMPLOYER" field="employer" sort={sort} onSort={onSort} />
              <SortHeader label="LOCATION" field="municipality" sort={sort} onSort={onSort} />
              <SortHeader label="FIT" field="rating" sort={sort} onSort={onSort} />
              <SortHeader label="DEADLINE" field="deadline" sort={sort} onSort={onSort} />
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((job, index) => (
              <tr key={`${job.job_id}-${index}`}>
                <td className="data-row-number"><a className="data-id-link" href={jobDetailsHref(job.job_id, 'jobs')}>{job.job_id}</a></td>
                <td className="data-title-cell">
                  <span className="data-title-marker" />
                  <a className="data-record-link" href={jobDetailsHref(job.job_id, 'jobs')}>{job.headline ?? 'Title unavailable'}</a>
                </td>
                <td>{job.employer ?? '—'}</td>
                <td>{job.municipality ?? '—'}</td>
                <td>{job.rating === null ? '—' : <span className="data-rating">{job.rating}</span>}</td>
                <td
                  className={isDeadlineApproaching(job.deadline) ? 'deadline-approaching' : undefined}
                  title={isDeadlineApproaching(job.deadline) ? 'Deadline is within 7 days' : undefined}
                >
                  {formatDeadline(job.deadline)}
                </td>
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

function ApplicationTable({
  applications,
  search,
  sort,
  onSort,
}: {
  applications: FeedApplication[]
  search: string
  sort: SortState
  onSort: (field: string) => void
}) {
  const filteredRows = applications.filter((application) => matchingText([
    application.job_id === null ? null : String(application.job_id),
    application.headline,
    application.employer,
    application.rating,
    application.applied ? 'applied' : 'not applied',
  ], search))
  const rows = sortRows(filteredRows, sort, (application, key) => {
    if (key === 'job_id') return application.job_id
    if (key === 'headline') return application.headline
    if (key === 'employer') return application.employer
    if (key === 'rating') return numericValue(application.rating)
    if (key === 'applied') return application.applied
    return null
  })

  return (
    <>
      <div className="data-table-shell" id="data-feed-panel" role="tabpanel" aria-labelledby="data-tab-applications">
        <table className="data-table applications-data-table">
          <thead>
            <tr>
              <SortHeader label="JOB ID" field="job_id" sort={sort} onSort={onSort} />
              <SortHeader label="JOB" field="headline" sort={sort} onSort={onSort} />
              <SortHeader label="EMPLOYER" field="employer" sort={sort} onSort={onSort} />
              <SortHeader label="FIT" field="rating" sort={sort} onSort={onSort} />
              <SortHeader label="STATUS" field="applied" sort={sort} onSort={onSort} />
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((application, index) => (
              <tr key={`${application.job_id}-${index}`}>
                <td className="data-row-number">
                  {application.job_id === null
                    ? '—'
                    : <a className="data-id-link" href={jobDetailsHref(application.job_id, 'applications')}>{application.job_id}</a>}
                </td>
                <td className="data-title-cell">
                  <span className="data-title-marker" />
                  {application.job_id === null
                    ? <span>{application.headline ?? 'Job details unavailable'}</span>
                    : <a className="data-record-link" href={jobDetailsHref(application.job_id, 'applications')}>{application.headline ?? 'Title unavailable'}</a>}
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
  const [activeTab, setActiveTab] = useState<DataTab>(initialFeedTab)
  const [sortByTab, setSortByTab] = useState<Record<DataTab, SortState>>({
    titles: null,
    jobs: null,
    applications: null,
  })
  const sort = sortByTab[activeTab]

  function handleSort(field: string) {
    setSortByTab((current) => ({
      ...current,
      [activeTab]: current[activeTab]?.key === field
        ? { key: field, direction: current[activeTab].direction === 'asc' ? 'desc' : 'asc' }
        : { key: field, direction: 'asc' },
    }))
  }
  useEffect(() => {
    onSourceChange(activeTab === 'titles' ? titlesUrl : activeTab === 'jobs' ? jobsUrl : applicationsUrl)
  }, [activeTab, onSourceChange])

  const titlesQuery = useQuery({
    queryKey: ['workflow-titles', titlesUrl],
    queryFn: fetchTitles,
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
  const jobsQuery = useQuery({
    queryKey: ['workflow-jobs', jobsUrl],
    queryFn: fetchJobs,
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
  const applicationsQuery = useQuery({
    queryKey: ['workflow-applications', applicationsUrl],
    queryFn: fetchApplications,
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    refetchOnWindowFocus: false,
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
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <SortHeader
                    label="TITLE"
                    field="title"
                    sort={sort?.key === 'title' ? sort : null}
                    onSort={() => handleSort('title')}
                  />
                </tr>
              </thead>
              <tbody>
                {filteredTitles.length ? sortRows(filteredTitles, sort, (title) => title).map((title, index) => (
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
        <JobTable jobs={jobsQuery.data ?? []} search={search} sort={sort} onSort={handleSort} />
      ) : (
        <ApplicationTable applications={applicationsQuery.data ?? []} search={search} sort={sort} onSort={handleSort} />
      )}
    </section>
  )
}
