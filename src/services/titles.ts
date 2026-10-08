import type { JobTitle } from '../types/title'

export const titlesUrl = 'https://n8n-production-44538.up.railway.app/webhook/titles'

export async function fetchTitles(): Promise<JobTitle[]> {
  const response = await fetch(titlesUrl)
  if (!response.ok) throw new Error(`Titles request failed (${response.status})`)

  const payload: unknown = await response.json()
  if (Array.isArray(payload)) {
    if (payload.length === 1 && isLegacyTitleList(payload[0])) {
      return validateTitles(payload[0].title)
    }
    if (payload.every(isTitleRecord)) {
      return validateTitles(payload.map((record) => record.title))
    }
  }

  if (isLegacyTitleList(payload)) {
    return validateTitles(payload.title)
  }

  throw new Error('The titles workflow returned an unexpected response.')
}

function isTitleRecord(value: unknown): value is { title: string } {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
    && 'title' in value
    && typeof value.title === 'string'
}

function isLegacyTitleList(value: unknown): value is { title: unknown[] } {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
    && 'title' in value
    && Array.isArray(value.title)
}

function validateTitles(titles: unknown[]): JobTitle[] {
  if (!titles.every((title): title is string => typeof title === 'string' && title.trim().length > 0)) {
    throw new Error('The titles workflow returned an invalid title list.')
  }
  return titles
}
