import { createElement, Fragment, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Copy,
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

function formatCoverLetter(value: string): string {
  return value
    .replace(/\\+r\\+n/g, '\n')
    .replace(/\\+n/g, '\n')
    .replace(/\\+r/g, '\n')
}

function countryFlag(country: string | null): string {
  const normalized = country?.trim().toLocaleLowerCase()
  if (normalized === 'sverige' || normalized === 'sweden' || normalized === 'se') return '🇸🇪'
  if (normalized === 'norge' || normalized === 'norway' || normalized === 'no') return '🇳🇴'
  if (normalized === 'danmark' || normalized === 'denmark' || normalized === 'dk') return '🇩🇰'
  if (normalized === 'finland' || normalized === 'suomi' || normalized === 'fi') return '🇫🇮'
  return '🌐'
}

type MapTile = {
  key: string
  src: string
  x: number
  y: number
}

type JobMap = {
  tiles: MapTile[]
  location: string
  latitude: number
  longitude: number
}

function mapTiles(job: JobDetails): JobMap | null {
  if (job.latitude === null || job.longitude === null) return null

  const zoom = 4
  const tileSize = 256
  const tileCount = 2 ** zoom
  const latitude = Math.max(-85.05112878, Math.min(85.05112878, job.latitude))
  const latitudeRadians = latitude * Math.PI / 180
  const centerX = ((job.longitude + 180) / 360) * tileCount * tileSize
  const centerY = (
    (1 - Math.log(Math.tan(latitudeRadians) + 1 / Math.cos(latitudeRadians)) / Math.PI) / 2
  ) * tileCount * tileSize
  const originX = 180 - centerX
  const originY = 115 - centerY
  const firstColumn = Math.floor(-originX / tileSize)
  const lastColumn = Math.ceil((360 - originX) / tileSize)
  const firstRow = Math.floor(-originY / tileSize)
  const lastRow = Math.ceil((230 - originY) / tileSize)
  const tiles: MapTile[] = []

  for (let column = firstColumn; column < lastColumn; column += 1) {
    for (let row = firstRow; row < lastRow; row += 1) {
      if (row < 0 || row >= tileCount) continue
      const wrappedColumn = ((column % tileCount) + tileCount) % tileCount
      tiles.push({
        key: `${zoom}-${wrappedColumn}-${row}`,
        src: `https://tile.openstreetmap.org/${zoom}/${wrappedColumn}/${row}.png`,
        x: originX + column * tileSize,
        y: originY + row * tileSize,
      })
    }
  }

  return {
    tiles,
    location: [job.city, job.region, job.country].filter(Boolean).join(', ') || 'job location',
    latitude: job.latitude,
    longitude: job.longitude,
  }
}

function NordicMap({ map }: { map: JobMap }) {
  return (
    <svg
      className="nordic-map"
      viewBox="0 0 360 230"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`Map showing ${map.location}`}
    >
      <defs>
        <filter id="map-pin-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      {map.tiles.map((tile) => (
        <image
          className="nordic-map-tile"
          key={tile.key}
          href={tile.src}
          x={tile.x}
          y={tile.y}
          width="256"
          height="256"
        />
      ))}
      <rect className="map-theme-wash" width="360" height="230" />
      <circle className="map-pin-halo" cx="180" cy="115" r="12" filter="url(#map-pin-glow)" />
      <circle className="map-pin-ring" cx="180" cy="115" r="7" />
      <circle className="map-pin-core" cx="180" cy="115" r="3" />
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
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const location = [job.address, job.city, job.region].filter(Boolean).join(', ')
  const map = mapTiles(job)
  const sourceUrl = safeLink(job.url)
  const applicationUrl = safeLink(job.url_application)
  const publicationDate = displayDate(job.publication_date)
  const deadline = displayDate(job.deadline)
  const coverLetter = job.cover_letter ? formatCoverLetter(job.cover_letter) : null
  const hasCoverLetter = Boolean(coverLetter?.trim())

  async function copyCoverLetter() {
    if (!coverLetter) return
    try {
      await navigator.clipboard.writeText(coverLetter)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
  }

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
                <button
                  className={`job-copy-button${copyStatus === 'copied' ? ' copied' : ''}`}
                  type="button"
                  onClick={() => void copyCoverLetter()}
                  aria-label={copyStatus === 'copied' ? 'Cover letter copied' : 'Copy cover letter'}
                >
                  {copyStatus === 'copied' ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copyStatus === 'copied' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              {copyStatus === 'error' && (
                <p className="job-copy-error" role="alert">Couldn’t copy automatically. Select the letter text and copy it manually.</p>
              )}
              <div className="job-cover-letter">{coverLetter}</div>
            </section>
          )}
        </div>

        <aside className="job-detail-side-column">
          {(location || job.country || map) && (
            <section className="job-detail-card job-location-card">
              <div className="job-detail-section-heading">
                <span className="job-detail-section-icon"><MapPin size={15} /></span>
                <div><span className="section-kicker">LOCATION</span><h2>Where you’ll work</h2></div>
              </div>
              <div className="job-location-label">
                <span className="job-country-flag" role="img" aria-label={job.country ?? 'Country'}>{countryFlag(job.country)}</span>
                <span>{location || job.country}</span>
              </div>
              {map ? (
                <>
                  <div className="job-map-frame">
                    <NordicMap map={map} />
                    <span className="job-map-coordinate">LOCATION SIGNAL · {job.latitude?.toFixed(3)}, {job.longitude?.toFixed(3)}</span>
                  </div>
                  <div className="job-map-attribution">
                    <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>
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
  const requestedView = new URLSearchParams(window.location.search).get('view')
  const returnView = requestedView === 'jobs' || requestedView === 'applications' ? requestedView : 'titles'
  const query = useQuery({
    queryKey: ['workflow-job-details', jobId],
    queryFn: () => fetchJobDetails(jobId),
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  return (
    <section className="job-detail-page">
      <a className="job-detail-back" href={`/feed?view=${returnView}`}>
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
