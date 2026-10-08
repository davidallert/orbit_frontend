import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpDown, Clock3, Database, FileText, RefreshCw, Search, Tags } from 'lucide-react'
import { applicationsUrl, fetchApplications, fetchJobs, jobsUrl } from '../services/dataFeed'
import { fetchTitles, titlesUrl } from '../services/titles'
import type { FeedApplication, FeedJob } from '../types/dataFeed'

type DataTab = 'titles' | 'jobs' | 'applications'
type SortDirection = 'asc' | 'desc'
type SortState = { key: string; direction: SortDirection } | null
type PageSize = 50 | 'all'
type PaginationState = { page: number; pageSize: PageSize }
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

function initialPaginationState(): Record<DataTab, PaginationState> {
  const defaultState = { page: 1, pageSize: 50 as PageSize }
  return {
    titles: defaultState,
    jobs: defaultState,
    applications: defaultState,
  }
}

function formatFreshness(timestamp: number, now: number): string {
  const elapsedMinutes = Math.max(0, Math.floor((now - timestamp) / 60_000))
  if (elapsedMinutes < 1) return 'Updated just now'
  if (elapsedMinutes < 60) return `Updated ${elapsedMinutes}m ago`
  if (elapsedMinutes < 24 * 60) return `Updated ${Math.floor(elapsedMinutes / 60)}h ago`
  return `Updated ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(timestamp)}`
}

function PaginationControls({
  total,
  pagination,
  onPageChange,
  onPageSizeChange,
}: {
  total: number
  pagination: PaginationState
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: PageSize) => void
}) {
  const pageCount = pagination.pageSize === 'all' ? 1 : Math.max(1, Math.ceil(total / pagination.pageSize))
  const page = Math.min(pagination.page, pageCount)
  const firstRow = total === 0 ? 0 : pagination.pageSize === 'all' ? 1 : (page - 1) * pagination.pageSize + 1
  const lastRow = pagination.pageSize === 'all' ? total : Math.min(page * pagination.pageSize, total)

  return (
    <div className="data-pagination">
      <span className="data-pagination-range">
        {total === 0 ? 'No rows' : `Rows ${firstRow.toLocaleString()}–${lastRow.toLocaleString()} of ${total.toLocaleString()}`}
      </span>
      <div className="data-pagination-actions">
        <label className="data-page-size">
          <span>Rows</span>
          <select
            aria-label="Rows per page"
            value={pagination.pageSize}
            onChange={(event) => onPageSizeChange(event.target.value === 'all' ? 'all' : 50)}
          >
            <option value={50}>50</option>
            <option value="all">All</option>
          </select>
        </label>
        {pagination.pageSize !== 'all' && (
          <>
            <span className="data-page-number">Page {page.toLocaleString()} of {pageCount.toLocaleString()}</span>
            <button
              className="data-page-button"
              type="button"
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ArrowLeft size={13} />
            </button>
            <button
              className="data-page-button"
              type="button"
              aria-label="Next page"
              disabled={page >= pageCount}
              onClick={() => onPageChange(page + 1)}
            >
              <ArrowRight size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  )
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
  pagination,
  onPageChange,
  onPageSizeChange,
}: {
  jobs: FeedJob[]
  search: string
  sort: SortState
  onSort: (field: string) => void
  pagination: PaginationState
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: PageSize) => void
}) {
  const filteredRows = jobs.filter((job) => matchingText([
    String(job.job_id),
    job.headline,
    job.employer,
    job.municipality,
    job.rating,
  ], search))
  const sortedRows = sortRows(filteredRows, sort, (job, key) => {
    if (key === 'job_id') return job.job_id
    if (key === 'headline') return job.headline
    if (key === 'employer') return job.employer
    if (key === 'municipality') return job.municipality
    if (key === 'rating') return numericValue(job.rating)
    if (key === 'deadline') return dateValue(job.deadline)
    return null
  })
  const pageCount = pagination.pageSize === 'all' ? 1 : Math.max(1, Math.ceil(sortedRows.length / pagination.pageSize))
  const page = Math.min(pagination.page, pageCount)
  const rows = pagination.pageSize === 'all'
    ? sortedRows
    : sortedRows.slice((page - 1) * pagination.pageSize, page * pagination.pageSize)

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
        <span>{filteredRows.length.toLocaleString()} of {jobs.length.toLocaleString()} jobs match</span>
        <span>Open any row to view job details</span>
      </div>
      <PaginationControls
        total={sortedRows.length}
        pagination={{ ...pagination, page }}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </>
  )
}

function ApplicationTable({
  applications,
  search,
  sort,
  onSort,
  pagination,
  onPageChange,
  onPageSizeChange,
}: {
  applications: FeedApplication[]
  search: string
  sort: SortState
  onSort: (field: string) => void
  pagination: PaginationState
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: PageSize) => void
}) {
  const filteredRows = applications.filter((application) => matchingText([
    application.job_id === null ? null : String(application.job_id),
    application.headline,
    application.employer,
    application.rating,
    application.applied ? 'applied' : 'not applied',
  ], search))
  const sortedRows = sortRows(filteredRows, sort, (application, key) => {
    if (key === 'job_id') return application.job_id
    if (key === 'headline') return application.headline
    if (key === 'employer') return application.employer
    if (key === 'rating') return numericValue(application.rating)
    if (key === 'applied') return application.applied
    return null
  })
  const pageCount = pagination.pageSize === 'all' ? 1 : Math.max(1, Math.ceil(sortedRows.length / pagination.pageSize))
  const page = Math.min(pagination.page, pageCount)
  const rows = pagination.pageSize === 'all'
    ? sortedRows
    : sortedRows.slice((page - 1) * pagination.pageSize, page * pagination.pageSize)

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
        <span>{filteredRows.length.toLocaleString()} of {applications.length.toLocaleString()} applications match</span>
        <span>Open any row to view the linked job</span>
      </div>
      <PaginationControls
        total={sortedRows.length}
        pagination={{ ...pagination, page }}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </>
  )
}

export default function DataFeedPage({ onSourceChange }: DataFeedPageProps) {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<DataTab>(initialFeedTab)
  const [paginationByTab, setPaginationByTab] = useState<Record<DataTab, PaginationState>>(initialPaginationState)
  const [clock, setClock] = useState(Date.now)
  const [sortByTab, setSortByTab] = useState<Record<DataTab, SortState>>({
    titles: null,
    jobs: null,
    applications: null,
  })
  const sort = sortByTab[activeTab]

  function handleSort(field: string) {
    setPaginationByTab((current) => ({
      ...current,
      [activeTab]: { ...current[activeTab], page: 1 },
    }))
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
  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  function updatePage(page: number) {
    setPaginationByTab((current) => ({
      ...current,
      [activeTab]: { ...current[activeTab], page },
    }))
  }

  function updatePageSize(pageSize: PageSize) {
    setPaginationByTab((current) => ({
      ...current,
      [activeTab]: { page: 1, pageSize },
    }))
  }

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
  const activePagination = paginationByTab[activeTab]
  const sortedTitles = useMemo(
    () => sortRows(filteredTitles, sort, (title) => title),
    [filteredTitles, sort],
  )
  const titlePageCount = activePagination.pageSize === 'all'
    ? 1
    : Math.max(1, Math.ceil(sortedTitles.length / activePagination.pageSize))
  const titlePage = Math.min(activePagination.page, titlePageCount)
  const visibleTitles = activePagination.pageSize === 'all'
    ? sortedTitles
    : sortedTitles.slice((titlePage - 1) * activePagination.pageSize, titlePage * activePagination.pageSize)

  function updateSearch(value: string) {
    setSearch(value)
    setPaginationByTab((current) => ({
      ...current,
      [activeTab]: { ...current[activeTab], page: 1 },
    }))
  }

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
        <div className="data-feed-freshness" role="status" aria-live="polite">
          <Clock3 size={12} />
          <span>
            {activeQuery.dataUpdatedAt
              ? formatFreshness(activeQuery.dataUpdatedAt, clock)
              : activeQuery.isFetching
                ? 'Loading latest data'
                : 'Not loaded yet'}
          </span>
          {activeQuery.isFetching && <span className="freshness-refreshing">· Refreshing</span>}
        </div>
        <div className="data-feed-actions">
          <label className="data-search">
            <Search size={14} aria-hidden="true" />
            <input
              type="search"
              aria-label={`Filter ${activeLabel.toLowerCase()}`}
              placeholder={`Filter ${activeLabel.toLowerCase()}`}
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
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
                {visibleTitles.length ? visibleTitles.map((title, index) => (
                  <tr key={`${title}-${index}`}>
                    <td className="data-row-number">
                      {activePagination.pageSize === 'all'
                        ? index + 1
                        : (titlePage - 1) * activePagination.pageSize + index + 1}
                    </td>
                    <td className="data-title-cell"><span className="data-title-marker" />{title}</td>
                  </tr>
                )) : (
                  <tr><td className="data-table-loading" colSpan={2}>{search ? 'No titles match your filter.' : 'No titles have been added yet.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="data-table-footer">
            <span>{filteredTitles.length.toLocaleString()} of {(titlesQuery.data?.length ?? 0).toLocaleString()} titles match</span>
            <span>Source · n8n titles feed</span>
          </div>
          <PaginationControls
            total={filteredTitles.length}
            pagination={{ ...activePagination, page: titlePage }}
            onPageChange={updatePage}
            onPageSizeChange={updatePageSize}
          />
        </>
      ) : activeTab === 'jobs' ? (
        <JobTable
          jobs={jobsQuery.data ?? []}
          search={search}
          sort={sort}
          onSort={handleSort}
          pagination={activePagination}
          onPageChange={updatePage}
          onPageSizeChange={updatePageSize}
        />
      ) : (
        <ApplicationTable
          applications={applicationsQuery.data ?? []}
          search={search}
          sort={sort}
          onSort={handleSort}
          pagination={activePagination}
          onPageChange={updatePage}
          onPageSizeChange={updatePageSize}
        />
      )}
    </section>
  )
}
