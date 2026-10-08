export type JobMetrics = {
  count: number
  average_rating: number
  max_rating: number
  min_rating: number
  occupation_label: string
  occupation_group: string
  occupation_field: string
  occupation_label_count: number
  occupation_group_count: number
  occupation_field_count: number
  createdAt: string
  updatedAt: string
}

export type CountMetrics = {
  count: number
  createdAt: string
  updatedAt: string
}

export type ScoredMetrics = CountMetrics & {
  average_rating: number
  max_rating: number
  min_rating: number
}

export type Metrics = {
  job: JobMetrics
  title: CountMetrics
  application: ScoredMetrics
  updatedAt: string
}
