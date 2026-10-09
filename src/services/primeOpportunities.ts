export type PrimeOpportunity = {
  job_id: number
  headline: string
  employer: string
  rating: number
  applied: boolean
}

export const primeOpportunitiesUrl = 'https://n8n-production-44538.up.railway.app/webhook/prime-opportunities'

export async function fetchPrimeOpportunities(): Promise<PrimeOpportunity[]> {
  const response = await fetch(primeOpportunitiesUrl)
  if (!response.ok) throw new Error(`Prime opportunities request failed (${response.status})`)

  const payload: unknown = await response.json()
  if (!Array.isArray(payload)) throw new Error('The prime opportunities response was not an array.')

  return payload.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`Prime opportunity item ${index + 1} was not an object.`)
    }

    const item = entry as Record<string, unknown>
    const jobId = item.job_id
    const headline = item.headline
    const employer = item.employer
    const rating = item.rating
    const applied = item.applied

    if (typeof jobId !== 'number' || typeof headline !== 'string' || typeof employer !== 'string') {
      throw new Error(`Prime opportunity item ${index + 1} is missing a required field.`)
    }

    const parsedRating = typeof rating === 'number' ? rating : Number(rating)

    return {
      job_id: jobId,
      headline,
      employer,
      rating: Number.isFinite(parsedRating) ? parsedRating : 0,
      applied: typeof applied === 'boolean' ? applied : false,
    }
  })
}
