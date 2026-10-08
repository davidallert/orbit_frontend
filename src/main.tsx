import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { dehydrate, hydrate, QueryClient, QueryClientProvider, type DehydratedState } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

const workflowCacheKey = 'orbit-workflow-query-cache'
const persistedQueryKeys = new Set([
  'workflow-titles',
  'workflow-jobs',
  'workflow-applications',
  'workflow-job-details',
])
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
    },
  },
})

try {
  const persistedCache = window.sessionStorage.getItem(workflowCacheKey)
  if (persistedCache) hydrate(queryClient, JSON.parse(persistedCache) as DehydratedState)
} catch (error) {
  console.warn('Unable to restore the workflow data cache for this tab.', error)
  window.sessionStorage.removeItem(workflowCacheKey)
}

queryClient.getQueryCache().subscribe((event) => {
  if (event.type !== 'updated' || event.action.type !== 'success') return
  try {
    const cachedQueries = dehydrate(queryClient, {
      shouldDehydrateQuery: (query) =>
        typeof query.queryKey[0] === 'string'
        && persistedQueryKeys.has(query.queryKey[0])
        && query.state.data !== undefined,
    })
    window.sessionStorage.setItem(workflowCacheKey, JSON.stringify(cachedQueries))
  } catch (error) {
    console.warn('Unable to save the workflow data cache for this tab.', error)
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
