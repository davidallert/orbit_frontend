export type FeedJob = {
  job_id: number
  headline: string | null
  url: string | null
  employer: string | null
  municipality: string | null
  rating: string | null
  deadline: string | null
}

export type FeedApplication = {
  job_id: number | null
  headline: string | null
  url: string | null
  employer: string | null
  rating: string | null
  applied: boolean
}
