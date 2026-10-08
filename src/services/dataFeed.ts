import type { FeedApplication, FeedJob } from '../types/dataFeed'

const webhookBaseUrl = 'https://n8n-production-44538.up.railway.app/webhook'
export const jobsUrl = `${webhookBaseUrl}/jobs`
export const applicationsUrl = `${webhookBaseUrl}/applications`
export const singleJobUrl = (jobId: string | number): string => {
  const url = new URL(`${webhookBaseUrl}/single`)
  url.searchParams.set('jobId', String(jobId))
  return url.toString()
}

function nullableString(value: unknown, field: string): string | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error(`The data feed returned an invalid ${field}.`)
  }
  return String(value)
}

function jobId(value: unknown): number {
  const id = typeof value === 'string' ? Number(value) : value
  if (typeof id !== 'number' || !Number.isSafeInteger(id)) {
    throw new Error('The data feed returned an invalid job ID.')
  }
  return id
}

function nullableJobId(value: unknown): number | null {
  return value === null || value === undefined ? null : jobId(value)
}

async function fetchRows<T>(url: string, mapRow: (row: Record<string, unknown>) => T): Promise<T[]> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Data feed request failed (${response.status})`)

  const payload: unknown = await response.json()
  if (!Array.isArray(payload)) throw new Error('The data feed returned an unexpected response.')

  return payload.map((item): T => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error('The data feed contains an invalid record.')
    }
    return mapRow(item as Record<string, unknown>)
  })
}

export function fetchJobs(): Promise<FeedJob[]> {
  return fetchRows(jobsUrl, (row) => ({
    job_id: jobId(row.job_id),
    headline: nullableString(row.headline, 'job title'),
    url: nullableString(row.url, 'job URL'),
    employer: nullableString(row.employer, 'employer'),
    municipality: nullableString(row.municipality, 'municipality'),
    rating: nullableString(row.rating, 'rating'),
    deadline: nullableString(row.deadline, 'deadline'),
  }))
}

export function fetchApplications(): Promise<FeedApplication[]> {
  return fetchRows(applicationsUrl, (row) => {
    if (typeof row.applied !== 'boolean') {
      throw new Error('The data feed returned an invalid application status.')
    }
    return {
      job_id: nullableJobId(row.job_id),
      headline: nullableString(row.headline, 'job title'),
      url: nullableString(row.url, 'job URL'),
      employer: nullableString(row.employer, 'employer'),
      rating: nullableString(row.rating, 'rating'),
      applied: row.applied,
    }
  })
}

export type JobDetails = {
  job_id: number
  headline: string | null
  employer: string | null
  url: string | null
  rating: string | null
  applied: boolean | null
  cover_letter: string | null
  deadline: string | null
  description_formatted: string | null
  occupation_label: string | null
  occupation_group: string | null
  occupation_field: string | null
  url_application: string | null
  region: string | null
  country: string | null
  address: string | null
  city: string | null
  longitude: number | null
  latitude: number | null
  publication_date: string | null
}

function nullableBoolean(value: unknown, field: string): boolean | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'boolean') throw new Error(`The job details returned an invalid ${field}.`)
  return value
}

function nullableCoordinate(value: unknown, field: string, minimum: number, maximum: number): number | null {
  if (value === null || value === undefined || value === '') return null
  const coordinate = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
  if (!Number.isFinite(coordinate) || coordinate < minimum || coordinate > maximum) {
    throw new Error(`The job details returned an invalid ${field}.`)
  }
  return coordinate
}

export async function fetchJobDetails(jobId: string): Promise<JobDetails> {
  const response = await fetch(singleJobUrl(jobId))
  if (!response.ok) throw new Error(`Job details request failed (${response.status})`)

  const payload: unknown = await response.json()
  const record = Array.isArray(payload) ? payload[0] : payload
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new Error('No details were found for this job.')
  }
  const row = record as Record<string, unknown>

  return {
    job_id: jobIdValue(row.job_id ?? jobId),
    headline: nullableString(row.headline, 'job title'),
    employer: nullableString(row.employer, 'employer'),
    url: nullableString(row.url, 'job URL'),
    rating: nullableString(row.rating, 'rating'),
    applied: nullableBoolean(row.applied, 'application status'),
    cover_letter: nullableString(row.cover_letter, 'cover letter'),
    deadline: nullableString(row.deadline, 'application deadline'),
    description_formatted: nullableString(row.description_formatted, 'job description'),
    occupation_label: nullableString(row.occupation_label, 'occupation'),
    occupation_group: nullableString(row.occupation_group, 'occupation group'),
    occupation_field: nullableString(row.occupation_field, 'occupation field'),
    url_application: nullableString(row.url_application, 'application URL'),
    region: nullableString(row.region, 'region'),
    country: nullableString(row.country, 'country'),
    address: nullableString(row.address, 'address'),
    city: nullableString(row.city, 'city'),
    longitude: nullableCoordinate(row.longitude, 'longitude', -180, 180),
    latitude: nullableCoordinate(row.latitude, 'latitude', -90, 90),
    publication_date: nullableString(row.publication_date, 'publication date'),
  }
}

function jobIdValue(value: unknown): number {
  const id = typeof value === 'string' ? Number(value) : value
  if (typeof id !== 'number' || !Number.isSafeInteger(id)) {
    throw new Error('The job details returned an invalid job ID.')
  }
  return id
}
