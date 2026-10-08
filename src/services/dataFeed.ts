import type { FeedApplication, FeedJob } from '../types/dataFeed'

const webhookBaseUrl = 'https://n8n-production-44538.up.railway.app/webhook'
export const jobsUrl = `${webhookBaseUrl}/jobs`
export const applicationsUrl = `${webhookBaseUrl}/applications`

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
