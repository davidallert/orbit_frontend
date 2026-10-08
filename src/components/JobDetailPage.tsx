import { createElement, Fragment, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  ExternalLink,
  FileText,
  MapPin,
  Target,
} from 'lucide-react'
import { fetchJobDetails, singleJobUrl } from '../services/dataFeed'
import type { JobDetails } from '../services/dataFeed'
import '../styles/job-detail.css'

type JobDetailPageProps = {
  jobId: string
}

const allowedDescriptionTags = new Set([
  'p', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'br', 'h2', 'h3', 'h4', 'blockquote',
])
const blockedDescriptionTags = new Set(['script', 'style', 'iframe', 'object', 'svg', 'math', 'template'])

function safeLink(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

function formattedNodes(parent: ParentNode): ReactNode[] {
  return Array.from(parent.childNodes).flatMap((node, index): ReactNode[] => {
    if (node.nodeType === Node.TEXT_NODE) {
      return [createElement(Fragment, { key: index }, node.textContent)]
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return []

    const element = node as HTMLElement
    const tag = element.tagName.toLowerCase()
    if (blockedDescriptionTags.has(tag)) return []

    const children = formattedNodes(element)
    if (tag === 'a') {
      const href = safeLink(element.getAttribute('href'))
      return [href
        ? createElement('a', { key: index, href, target: '_blank', rel: 'noreferrer' }, ...children)
        : createElement(Fragment, { key: index }, ...children)]
    }
    if (allowedDescriptionTags.has(tag)) {
      return [createElement(tag, { key: index }, ...children)]
    }
    return [createElement(Fragment, { key: index }, ...children)]
  })
}

function FormattedDescription({ html }: { html: string }) {
  const document = new DOMParser().parseFromString(html, 'text/html')
  return <div className="job-rich-content">{formattedNodes(document.body)}</div>
}

function displayDate(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function countryFlag(country: string | null): string {
  const normalized = country?.trim().toLocaleLowerCase()
  if (normalized === 'sverige' || normalized === 'sweden' || normalized === 'se') return '🇸🇪'
  if (normalized === 'norge' || normalized === 'norway' || normalized === 'no') return '🇳🇴'
  if (normalized === 'danmark' || normalized === 'denmark' || normalized === 'dk') return '🇩🇰'
  if (normalized === 'finland' || normalized === 'suomi' || normalized === 'fi') return '🇫🇮'
  return '🌐'
}

type MapPoint = {
  x: number
  y: number
}

function mapPoint(job: JobDetails): MapPoint | null {
  if (job.latitude === null || job.longitude === null) return null
  const west = 4
  const east = 32
  const south = 54
  const north = 71
  if (job.longitude < west || job.longitude > east || job.latitude < south || job.latitude > north) return null
  return {
    x: 20 + ((job.longitude - west) / (east - west)) * 320,
    y: 14 + ((north - job.latitude) / (north - south)) * 200,
  }
}

function NordicMap({ point, location }: { point: MapPoint; location: string }) {
  return (
    <svg className="nordic-map" viewBox="0 0 360 230" role="img" aria-label={`Map showing ${location} in northern Europe`}>
      <defs>
        <linearGradient id="map-water" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#263452" />
          <stop offset="100%" stopColor="#172139" />
        </linearGradient>
        <linearGradient id="map-land" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#555274" />
          <stop offset="100%" stopColor="#343c5b" />
        </linearGradient>
        <filter id="map-pin-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <rect width="360" height="230" fill="url(#map-water)" />
      <g className="map-grid">
        <path d="M0 46H360M0 92H360M0 138H360M0 184H360M72 0V230M144 0V230M216 0V230M288 0V230" />
      </g>
      <path className="map-landform" d="M115 6C129 13 131 29 124 41C119 52 128 62 122 75C116 87 126 98 120 110C114 123 127 134 119 148C113 160 126 171 119 182C112 193 122 202 114 214L93 225L0 230V0H105C108 2 112 4 115 6Z" />
      <path className="map-landform" d="M218 18C237 22 251 38 251 58C250 78 242 96 246 115C250 134 237 148 241 166C245 182 229 195 225 210C221 225 205 232 190 226C175 220 162 221 151 209C141 199 135 188 123 181C113 174 106 163 112 151C118 140 109 128 115 117C122 105 114 94 121 83C128 72 122 59 132 49C142 39 142 28 155 22C173 13 198 9 218 18Z" />
      <path className="map-landform map-finland" d="M252 27C273 24 294 34 306 51C318 68 315 84 329 99C339 110 338 127 329 140C320 153 317 168 304 179C293 189 285 204 270 207C256 208 245 197 241 184C236 171 244 157 238 145C232 132 245 118 241 105C237 92 250 78 245 65C241 51 242 37 252 27Z" />
      <path className="map-coastline" d="M218 18C237 22 251 38 251 58C250 78 242 96 246 115C250 134 237 148 241 166C245 182 229 195 225 210C221 225 205 232 190 226C175 220 162 221 151 209C141 199 135 188 123 181" />
      <g className="map-roads">
        <path d="M142 198C163 179 177 159 191 143S213 104 222 76M156 207C177 190 198 174 216 160S235 133 244 119M130 162C157 153 181 146 204 130S232 99 244 83M172 222C183 199 193 182 202 160" />
      </g>
      <g className="map-place-labels">
        <text x="188" y="170">STOCKHOLM</text>
        <text x="123" y="211">GÖTEBORG</text>
        <text x="211" y="112">OSLO</text>
        <text x="275" y="131">FINLAND</text>
        <text x="165" y="92">SWEDEN</text>
      </g>
      <circle className="map-pin-halo" cx={point.x} cy={point.y} r="12" filter="url(#map-pin-glow)" />
      <circle className="map-pin-ring" cx={point.x} cy={point.y} r="7" />
      <circle className="map-pin-core" cx={point.x} cy={point.y} r="3" />
    </svg>
  )
}

function DetailValue({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="job-detail-fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function JobContent({ job }: { job: JobDetails }) {
  const location = [job.address, job.city, job.region].filter(Boolean).join(', ')
  const point = mapPoint(job)
  const sourceUrl = safeLink(job.url)
  const applicationUrl = safeLink(job.url_application)
  const publicationDate = displayDate(job.publication_date)
  const deadline = displayDate(job.deadline)
  const hasCoverLetter = Boolean(job.cover_letter?.trim())

  return (
    <>
      <header className="job-detail-hero">
        <div className="job-detail-hero-main">
          <span className="job-detail-icon"><BriefcaseBusiness size={18} /></span>
          <div>
            <span className="section-kicker">JOB RECORD · {job.job_id}</span>
            <h1>{job.headline ?? 'Job details'}</h1>
            <p>{job.employer ?? 'Employer not provided'}{location ? ` · ${location}` : ''}</p>
          </div>
        </div>
        <div className="job-detail-hero-actions">
          {job.rating !== null && (
            <span className="job-score-pill"><Target size={13} /> FIT {job.rating}</span>
          )}
          {sourceUrl && (
            <a className="job-external-link" href={sourceUrl} target="_blank" rel="noreferrer">
              <span>Original listing</span><ExternalLink size={13} />
            </a>
          )}
        </div>
      </header>

      <div className="job-detail-layout">
        <div className="job-detail-main-column">
          {job.description_formatted?.trim() && (
            <section className="job-detail-card job-description-card">
              <div className="job-detail-section-heading">
                <span className="job-detail-section-icon"><FileText size={15} /></span>
                <div><span className="section-kicker">THE OPPORTUNITY</span><h2>Job description</h2></div>
              </div>
              <FormattedDescription html={job.description_formatted} />
            </section>
          )}

          {hasCoverLetter && (
            <section className="job-detail-card job-cover-letter-card">
              <div className="job-detail-section-heading">
                <span className="job-detail-section-icon"><FileText size={15} /></span>
                <div><span className="section-kicker">APPLICATION MATERIAL</span><h2>Cover letter</h2></div>
              </div>
              <div className="job-cover-letter">{job.cover_letter}</div>
            </section>
          )}
        </div>

        <aside className="job-detail-side-column">
          {(location || job.country || point) && (
            <section className="job-detail-card job-location-card">
              <div className="job-detail-section-heading">
                <span className="job-detail-section-icon"><MapPin size={15} /></span>
                <div><span className="section-kicker">LOCATION</span><h2>Where you’ll work</h2></div>
              </div>
              <div className="job-location-label">
                <span className="job-country-flag" role="img" aria-label={job.country ?? 'Country'}>{countryFlag(job.country)}</span>
                <span>{location || job.country}</span>
              </div>
              {point ? (
                <>
                  <div className="job-map-frame">
                    <NordicMap point={point} location={location || job.country || 'job location'} />
                    <span className="job-map-coordinate">LOCATION SIGNAL · {job.latitude?.toFixed(3)}, {job.longitude?.toFixed(3)}</span>
                  </div>
                  <a
                    className="job-map-link"
                    href={`https://www.openstreetmap.org/?mlat=${job.latitude}&mlon=${job.longitude}#map=13/${job.latitude}/${job.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Explore map <ExternalLink size={12} />
                  </a>
                </>
              ) : (
                <p className="job-map-unavailable">Map coordinates are not available for this listing.</p>
              )}
            </section>
          )}

          <section className="job-detail-card job-facts-card">
            <div className="job-detail-section-heading">
              <span className="job-detail-section-icon"><BriefcaseBusiness size={15} /></span>
              <div><span className="section-kicker">ROLE SNAPSHOT</span><h2>At a glance</h2></div>
            </div>
            <DetailValue label="OCCUPATION" value={job.occupation_label} />
            <DetailValue label="GROUP" value={job.occupation_group} />
            <DetailValue label="FIELD" value={job.occupation_field} />
            {(publicationDate || deadline) && (
              <div className="job-date-facts">
                {publicationDate && <span><CalendarDays size={12} /> Published {publicationDate}</span>}
                {deadline && <span><CalendarDays size={12} /> Apply by {deadline}</span>}
              </div>
            )}
            {job.applied !== null && (
              <div className={`job-applied-state${job.applied ? ' is-applied' : ''}`}>
                <span className="job-state-dot" />
                {job.applied ? 'Application submitted' : 'Not yet applied'}
              </div>
            )}
            {applicationUrl && (
              <a className="job-apply-link" href={applicationUrl} target="_blank" rel="noreferrer">
                Open application <ExternalLink size={13} />
              </a>
            )}
          </section>
        </aside>
      </div>
    </>
  )
}

export default function JobDetailPage({ jobId }: JobDetailPageProps) {
  const query = useQuery({
    queryKey: ['workflow-job-details', jobId],
    queryFn: () => fetchJobDetails(jobId),
    staleTime: 60_000,
    retry: 1,
  })

  return (
    <section className="job-detail-page">
      <a className="job-detail-back" href="/feed">
        <ArrowLeft size={14} />
        <span>Back to data feed</span>
      </a>

      {query.isPending ? (
        <div className="job-detail-state" role="status">Loading job {jobId}…</div>
      ) : query.isError ? (
        <div className="job-detail-state error" role="alert">
          <strong>Couldn’t load this job.</strong>
          <span>{query.error.message}</span>
          <button type="button" onClick={() => void query.refetch()}>Try again</button>
          <code>{singleJobUrl(jobId)}</code>
        </div>
      ) : (
        <JobContent job={query.data} />
      )}
    </section>
  )
}
