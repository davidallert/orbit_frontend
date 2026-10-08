import type { Metrics } from '../types/metrics'

export const metricsUrl = import.meta.env.VITE_METRICS_URL ?? ''
export const metricsEndpoint = new URL(metricsUrl)

export async function fetchMetrics(): Promise<Metrics> {
  const response = await fetch(metricsUrl)
  if (!response.ok) throw new Error(`Metrics request failed (${response.status})`)
  const payload: unknown = await response.json()
  const data = Array.isArray(payload) ? payload[0] : payload

  if (!data || typeof data !== 'object') throw new Error('The workflow returned an unexpected response.')
  const responseData = data as Record<string, unknown>
  const job = responseData.job
  const title = responseData.title
  const application = responseData.application
  if (!job || typeof job !== 'object') throw new Error('The workflow response is missing job metrics.')
  if (!title || typeof title !== 'object') throw new Error('The workflow response is missing title metrics.')
  if (!application || typeof application !== 'object') throw new Error('The workflow response is missing application metrics.')
  const jobMetrics = job as Record<string, unknown>
  const titleMetrics = title as Record<string, unknown>
  const applicationMetrics = application as Record<string, unknown>

  if (
    typeof jobMetrics.count !== 'number' ||
    typeof jobMetrics.average_rating !== 'number' ||
    typeof jobMetrics.max_rating !== 'number' ||
    typeof jobMetrics.min_rating !== 'number' ||
    typeof jobMetrics.occupation_label !== 'string' ||
    typeof jobMetrics.occupation_group !== 'string' ||
    typeof jobMetrics.occupation_field !== 'string' ||
    typeof jobMetrics.occupation_label_count !== 'number' ||
    typeof jobMetrics.occupation_group_count !== 'number' ||
    typeof jobMetrics.occupation_field_count !== 'number' ||
    typeof jobMetrics.id !== 'number' ||
    typeof jobMetrics.createdAt !== 'string' ||
    typeof jobMetrics.updatedAt !== 'string'
  ) throw new Error('The job response is missing one or more expected fields.')
  if (
    typeof titleMetrics.count !== 'number' ||
    typeof titleMetrics.id !== 'number' ||
    typeof titleMetrics.createdAt !== 'string' ||
    typeof titleMetrics.updatedAt !== 'string'
  ) throw new Error('The title response is missing one or more expected fields.')
  if (
    typeof applicationMetrics.count !== 'number' ||
    typeof applicationMetrics.average_rating !== 'number' ||
    typeof applicationMetrics.max_rating !== 'number' ||
    typeof applicationMetrics.min_rating !== 'number' ||
    typeof applicationMetrics.id !== 'number' ||
    typeof applicationMetrics.createdAt !== 'string' ||
    typeof applicationMetrics.updatedAt !== 'string'
  ) throw new Error('The application response is missing one or more expected fields.')

  const updatedAt = [jobMetrics.updatedAt, titleMetrics.updatedAt, applicationMetrics.updatedAt]
    .sort()
    .at(-1)
  if (!updatedAt) throw new Error('The workflow response is missing an update timestamp.')

  return {
    job: {
      count: jobMetrics.count,
      average_rating: jobMetrics.average_rating,
      max_rating: jobMetrics.max_rating,
      min_rating: jobMetrics.min_rating,
      occupation_label: jobMetrics.occupation_label,
      occupation_group: jobMetrics.occupation_group,
      occupation_field: jobMetrics.occupation_field,
      occupation_label_count: jobMetrics.occupation_label_count,
      occupation_group_count: jobMetrics.occupation_group_count,
      occupation_field_count: jobMetrics.occupation_field_count,
      createdAt: jobMetrics.createdAt,
      updatedAt: jobMetrics.updatedAt,
    },
    title: {
      count: titleMetrics.count,
      createdAt: titleMetrics.createdAt,
      updatedAt: titleMetrics.updatedAt,
    },
    application: {
      count: applicationMetrics.count,
      average_rating: applicationMetrics.average_rating,
      max_rating: applicationMetrics.max_rating,
      min_rating: applicationMetrics.min_rating,
      createdAt: applicationMetrics.createdAt,
      updatedAt: applicationMetrics.updatedAt,
    },
    updatedAt,
  }
}
