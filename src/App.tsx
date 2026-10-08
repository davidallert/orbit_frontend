import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { CSSProperties } from 'react'
import {
  Activity,
  ArrowRight,
  BriefcaseBusiness,
  LayoutDashboard,
  Pause,
  Play,
  RefreshCw,
  Rocket,
  Satellite,
  Target,
  Zap,
} from 'lucide-react'
import './App.css'

type Metrics = {
  unique_count_job_id: number
  average_rating: number
  max_rating: number
  min_rating: number
  createdAt?: string
  updatedAt?: string
}

type Starfall = {
  id: number
  top: number
  left: number
  width: number
  duration: number
  intensity: number
}

const metricsUrl = import.meta.env.VITE_METRICS_URL ?? ''
const metricsEndpoint = new URL(metricsUrl)

function SpaceEffects({ animationsEnabled }: { animationsEnabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const [starfall, setStarfall] = useState<Starfall | null>(null)

  useEffect(() => {
    if (!animationsEnabled) return
    const mobilePerformanceMode = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches
    if (mobilePerformanceMode || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let timer = 0
    let sequence = 0
    const scheduleStarfall = () => {
      timer = window.setTimeout(() => {
        sequence += 1
        setStarfall({
          id: sequence,
          top: Math.random() * 96,
          left: Math.random() * 94,
          width: 56 + Math.random() * 86,
          duration: 0.9 + Math.random() * 1.2,
          intensity: 0.34 + Math.random() * 0.43,
        })
        scheduleStarfall()
      }, 10_000 + Math.random() * 20_000)
    }

    scheduleStarfall()
    return () => window.clearTimeout(timer)
  }, [animationsEnabled])

  useEffect(() => {
    const mobilePerformanceMode = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches
    const movePointer = (event: PointerEvent) => {
      if (cursorRef.current && event.pointerType === 'mouse') {
        cursorRef.current.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`
        cursorRef.current.classList.add('cursor-visible')
        cursorRef.current.classList.toggle('cursor-hover', Boolean((event.target as HTMLElement).closest('button, a, [role="button"]')))
      }
    }

    if (!animationsEnabled) return

    if (mobilePerformanceMode) {
      if (!window.matchMedia('(pointer: fine)').matches) return
      window.addEventListener('pointermove', movePointer, { passive: true })
      return () => window.removeEventListener('pointermove', movePointer)
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    type CloudBurst = { x: number; y: number; started: number; seed: number; size: number }
    const bursts: CloudBurst[] = []
    let width = 0
    let height = 0
    let frame = 0
    let running = false

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * ratio
      canvas.height = height * ratio
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    const burst = (event: MouseEvent) => {
      if (event.button !== 0 || (event.target as HTMLElement).closest('button, a, input, textarea, select, [role="button"]')) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      bursts.push({ x: event.clientX, y: event.clientY, started: performance.now(), seed: Math.random() * Math.PI * 2, size: 40 + Math.random() * 8 })
      if (!running) { running = true; frame = window.requestAnimationFrame(draw) }
    }

    const draw = (now: number) => {
      context.clearRect(0, 0, width, height)
      for (let index = bursts.length - 1; index >= 0; index -= 1) {
        const item = bursts[index]
        const age = Math.min(1, Math.max(0, (now - item.started) / 680))
        if (age >= 1) { bursts.splice(index, 1); continue }
        const ease = 1 - (1 - age) ** 3
        const radius = item.size * ease
        const fade = (1 - age) ** 1.6
        context.save()
        context.translate(item.x, item.y)
        context.globalAlpha = fade
        context.globalCompositeOperation = 'screen'
        context.shadowColor = '#a77aff'
        context.shadowBlur = 12
        const glowRadius = Math.max(1, radius * 0.82)
        const glow = context.createRadialGradient(0, 0, 0, 0, 0, glowRadius)
        glow.addColorStop(0, 'rgba(244, 236, 255, 0.68)')
        glow.addColorStop(0.38, 'rgba(185, 148, 255, 0.3)')
        glow.addColorStop(1, 'rgba(132, 91, 230, 0)')
        context.fillStyle = glow
        context.beginPath()
        context.arc(0, 0, glowRadius, 0, Math.PI * 2)
        context.fill()

        context.strokeStyle = `rgba(226, 205, 255, ${0.62 * fade})`
        context.lineWidth = 1.5
        context.beginPath()
        context.arc(0, 0, radius, 0, Math.PI * 2)
        context.stroke()

        context.strokeStyle = `rgba(190, 159, 255, ${0.38 * fade})`
        context.lineWidth = 1
        context.beginPath()
        context.arc(0, 0, Math.max(0, radius - 5), 0, Math.PI * 2)
        context.stroke()

        const flashRadius = 8 + ease * 8
        const flash = context.createRadialGradient(0, 0, 0, 0, 0, flashRadius)
        flash.addColorStop(0, '#fff')
        flash.addColorStop(0.42, '#eadbffbb')
        flash.addColorStop(1, '#ad7bff00')
        context.globalAlpha = fade * 0.8
        context.fillStyle = flash
        context.beginPath()
        context.arc(0, 0, flashRadius, 0, Math.PI * 2)
        context.fill()

        const smokeCount = 16
        for (let smokeIndex = 0; smokeIndex < smokeCount; smokeIndex += 1) {
          const phase = smokeIndex / smokeCount
          const angle = item.seed + phase * Math.PI * 2 + age * 0.34
          const distance = radius * (0.72 + Math.sin(smokeIndex * 2.1 + item.seed) * 0.12)
          const drift = Math.sin(age * 5 + smokeIndex * 1.8) * 2.5
          const smokeSize = 5 + Math.sin(smokeIndex * 1.7 + item.seed) * 1.6
          context.save()
          context.translate(Math.cos(angle) * distance + drift, Math.sin(angle) * distance - drift * 0.4)
          context.rotate(angle)
          context.globalAlpha = fade * 0.72
          context.shadowColor = '#b99cff'
          context.shadowBlur = smokeSize * 1.25
          context.lineCap = 'round'
          context.strokeStyle = `rgba(195, 167, 255, ${fade * 0.26})`
          context.lineWidth = smokeSize * 0.6
          context.beginPath()
          context.moveTo(-smokeSize * 1.7, smokeSize * 0.25)
          context.quadraticCurveTo(-smokeSize * 0.75, -smokeSize * 0.75, 0, 0)
          context.stroke()
          const smokeRadius = Math.max(1, smokeSize * 1.6)
          const wisp = context.createRadialGradient(0, 0, 0, 0, 0, smokeRadius)
          wisp.addColorStop(0, 'rgba(250, 247, 255, 0.78)')
          wisp.addColorStop(0.38, 'rgba(211, 194, 255, 0.52)')
          wisp.addColorStop(1, 'rgba(157, 124, 220, 0)')
          context.fillStyle = wisp
          context.beginPath()
          context.ellipse(0, 0, smokeRadius, smokeRadius * 0.68, 0, 0, Math.PI * 2)
          context.fill()
          context.restore()
        }

        context.lineWidth = 1
        context.shadowBlur = 4
        for (let spark = 0; spark < 5; spark += 1) {
          const angle = item.seed + spark * (Math.PI * 2 / 5)
          const inner = radius * 0.96
          const outer = radius * (1.08 + Math.sin(spark + item.seed) * 0.04)
          context.strokeStyle = `rgba(255, 222, 181, ${fade * 0.45})`
          context.beginPath()
          context.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner)
          context.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer)
          context.stroke()
        }
        context.restore()
      }
      if (bursts.length) frame = window.requestAnimationFrame(draw)
      else running = false
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', movePointer, { passive: true })
    window.addEventListener('click', burst)
    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', movePointer)
      window.removeEventListener('click', burst)
      window.cancelAnimationFrame(frame)
      context.clearRect(0, 0, width, height)
    }
  }, [animationsEnabled])

  return <><canvas className="space-effects" ref={canvasRef} aria-hidden="true" />{animationsEnabled && starfall && <span key={starfall.id} className="shooting-star" aria-hidden="true" style={{ top: `${starfall.top}vh`, left: `${starfall.left}vw`, '--starfall-width': `${starfall.width}px`, '--starfall-height': `${Math.max(1, starfall.width / 90)}px`, '--starfall-duration': `${starfall.duration}s`, '--starfall-intensity': starfall.intensity } as CSSProperties} onAnimationEnd={() => setStarfall(null)} />}<div className="moonlight" aria-hidden="true"><div className="moon-disc" /></div><div className="cloud-bank" aria-hidden="true"><svg viewBox="0 0 1440 370" preserveAspectRatio="xMidYMax slice"><defs><linearGradient id="cloud-dusk" x1="0" y1="0" x2="0.15" y2="1"><stop stopColor="#8798d4"/><stop offset=".45" stopColor="#6578b8"/><stop offset="1" stopColor="#384777"/></linearGradient><linearGradient id="cloud-lilac" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#bbc8f2"/><stop offset=".5" stopColor="#8697d2"/><stop offset="1" stopColor="#56689f"/></linearGradient><linearGradient id="cloud-foam" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#eff1ff"/><stop offset=".48" stopColor="#c8d2fa"/><stop offset="1" stopColor="#8799d5"/></linearGradient><pattern id="cloud-grain" width="34" height="28" patternUnits="userSpaceOnUse"><circle cx="5" cy="7" r="1.2" fill="#fff" opacity=".32"/><circle cx="21" cy="19" r="1.4" fill="#253666" opacity=".26"/><path d="M27 3h4" stroke="#fff" strokeWidth="1" opacity=".17"/></pattern></defs><path id="cloud-far" className="cloud-bank-far" d="M0 203c30-6 34-39 68-42 16-48 78-53 102-8 43-21 88 4 94 41 27 5 47 21 54 41c24 0 24 -24 62 -24 c38 0 38 24 63 24c-6-38 18-63 56-65 21-51 91-57 116-9 43-22 91 4 95 44 27 4 49 21 58 45c24 0 24 -26 64 -26 c40 0 40 26 64 26c-1-43 27-65 62-67 21-55 93-60 122-10 39-19 82 6 87 45 30 4 50 20 57 43c21 0 21 -22 54 -22 c33 0 33 22 54 22c9-33 35-47 68-44 22-45 82-48 108-7 31-15 66 4 73 37v190H0Z"/><use href="#cloud-far" className="cloud-texture"/><path id="cloud-mid" className="cloud-bank-mid" d="M0 254c23-17 60-9 72 17 25-48 88-51 110-7 40-17 81 4 86 38 34 2 51 16 60 39c25 0 25 -26 65 -26 c40 0 40 26 65 26c-8-45 25-72 61-63 19-48 84-60 115-15 43-18 82 9 82 48 31 3 49 17 56 38c25 0 25 -28 67 -28 c42 0 42 28 68 28c-3-42 35-70 70-55 22-48 80-49 106-7 38-23 87-1 90 41 29 1 50 12 57 33c25 0 25 -26 65 -26 c40 0 40 26 65 26c7-34 37-50 68-40 23-44 80-44 102-2 31-14 64 3 73 33v125H0Z"/><use href="#cloud-mid" className="cloud-texture"/><path id="cloud-near" className="cloud-bank-near" d="M0 293c31-13 59 3 66 31 21-3 35 8 42 27c19 0 19 -20 49 -20 c30 0 30 20 50 20c6-41 55-57 86-30 34-27 86-8 91 34 28 0 50 15 56 36c24 0 24 -26 64 -26 c40 0 40 26 65 26c-4-38 34-62 66-46 22-44 79-49 104-8 37-15 76 9 75 44 32 3 51 12 60 28c23 0 23 -24 61 -24 c38 0 38 24 62 24c7-43 49-63 85-42 28-36 82-31 100 10 38-17 78 4 82 37 31 0 52 12 62 32c22 0 22 -22 57 -22 c35 0 35 22 57 22c4-30 34-44 62-34 23-38 74-37 95 1 30-11 58 5 66 33v100H0Z"/><use href="#cloud-near" className="cloud-texture"/><path className="cloud-bank-foam" d="M0 337c40-24 82-13 99 18 24-25 71-22 92 10 29-12 61-4 76 19c32 0 32 -28 83 -28 c51 0 51 28 84 28c16-28 58-38 82-11 29-24 72-14 87 15c30 0 30 -28 80 -28 c50 0 50 28 80 28c16-29 59-40 85-12 32-23 73-9 84 21c29 0 29 -28 77 -28 c48 0 48 28 78 28c16-29 60-35 83-8 33-20 75-7 86 24c23 0 23 -24 61 -24 c38 0 38 24 62 24c12-23 48-28 67-5 22-24 62-21 79 5c21 0 21 -22 54 -22 c33 0 33 22 57 22v60H0Z"/><g className="cloud-bellies"><path d="M-80 392 C-69 375 -51 370 -32 379 C-35 358 -14 346 5 357 C15 330 44 326 61 348 C78 330 109 335 117 359 C136 348 160 358 167 379 C182 367 207 370 216 391 C229 369 253 363 274 376 C272 354 294 340 314 353 C326 326 356 323 374 346 C394 327 423 333 429 357 C448 345 472 355 479 377 C499 364 522 370 531 391 C543 370 569 365 589 379 C586 356 610 343 630 356 C641 329 672 325 690 349 C709 329 737 336 744 360 C765 349 789 359 796 382 C817 368 840 375 848 395 C860 371 886 365 905 379 C903 356 926 343 947 356 C958 329 990 325 1008 350 C1027 330 1057 338 1063 362 C1084 350 1108 361 1115 382 C1136 369 1160 375 1168 395 C1180 371 1207 364 1226 379 C1223 356 1246 344 1266 357 C1278 329 1309 326 1327 350 C1347 332 1375 338 1383 362 C1403 350 1425 360 1432 381 C1452 370 1473 378 1482 395 L1482 420 H-80 Z"/></g><path className="cloud-highlight" d="M65 230c20-8 25-26 45-34m67 35c16-8 31-8 44-1m284 31c14-12 16-29 35-34m48 34c14-8 23-8 35-3m287 15c13-14 14-30 34-37m49 38c15-10 28-9 40-2m263 3c12-11 17-25 33-28"/><path className="cloud-highlight cloud-highlight-low" d="M44 309c13-7 21-4 30 2m341 12c14-11 28-9 39-2m237 16c12-9 28-7 37 1m259-10c12-11 27-10 38-3m270 9c13-8 26-6 37 2"/></svg><span className="cloud-bank-star bank-star-one">✦</span><span className="cloud-bank-star bank-star-two">✧</span></div><div className="space-cursor" ref={cursorRef} aria-hidden="true"><svg viewBox="0 0 24 30" width="24" height="30"><path className="cursor-shape" d="M12 1.5 22 26 12 20.5 2 26Z"/></svg></div></>
}

async function fetchMetrics(): Promise<Metrics> {
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

  return {
    unique_count_job_id: jobMetrics.count,
    average_rating: jobMetrics.average_rating,
    max_rating: jobMetrics.max_rating,
    min_rating: jobMetrics.min_rating,
  }
}

function formatDate(value?: string) {
  if (!value) return 'Waiting for first sync'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Recently synced'
    : new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function App() {
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const query = useQuery({
    queryKey: ['workflow-metrics', metricsUrl],
    queryFn: fetchMetrics,
    refetchInterval: 24 * 60 * 60 * 1_000,
    staleTime: 30_000,
    retry: 1,
  })
  const metrics = query.data
  const ratingPercent = Math.min(100, Math.max(0, metrics?.average_rating ?? 0))

  return (
    <div className={`app-shell${animationsEnabled ? '' : ' animations-off'}`}>
      <SpaceEffects key={animationsEnabled ? 'enabled' : 'disabled'} animationsEnabled={animationsEnabled} />
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="Orbit home">
          <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="5.5" /><ellipse cx="16" cy="16" rx="13" ry="6.2" transform="rotate(-32 16 16)" /><circle className="brand-satellite" cx="25.7" cy="9" r="1.8" /></svg></span>
          <span>orbit<span className="brand-period">.</span></span>
        </a>

        <div className="workspace-switcher">
          <div className="workspace-icon"><BriefcaseBusiness size={15} /></div>
          <div className="workspace-copy"><strong>Job search</strong><span>Personal workspace</span></div>
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          <a className="nav-item active" href="#overview"><LayoutDashboard size={17} /><span>Overview</span><span className="nav-active-dot" /></a>
          <a className="nav-item muted-link" href="#signals"><Activity size={17} /><span>Search signals</span></a>
          <a className="nav-item muted-link" href="#workflow"><Zap size={17} /><span>Workflow</span></a>
          <a className="nav-item muted-link" href="#feed"><Satellite size={17} /><span>Data feed</span></a>
        </nav>

        <div className="nav-label integrations-label">RUN PROFILE</div>
        <div className="automation-card">
          <span className="automation-mark" aria-hidden="true"><i /><i /><i /></span>
          <span className="automation-copy"><strong>Job intelligence</strong><small>Discover · score · draft</small></span>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-note"><span>ORBIT / JOB SEARCH</span><span>One feed. Three useful steps.</span></div>
          <div className="profile-row"><div className="avatar">D</div><div><strong>David</strong><span>Job search workspace</span></div></div>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <div className="breadcrumbs"><span>ORBIT</span><span className="crumb-slash">/</span><strong>JOB INTELLIGENCE</strong></div>
          <div className="topbar-tools">
            <button
              className="motion-toggle"
              type="button"
              aria-label={animationsEnabled ? 'Turn animations off' : 'Turn animations on'}
              aria-pressed={!animationsEnabled}
              title={animationsEnabled ? 'Turn animations off' : 'Turn animations on'}
              onClick={() => setAnimationsEnabled((enabled) => !enabled)}
            >
              {animationsEnabled ? <Pause size={13} /> : <Play size={13} />}
              <span>{animationsEnabled ? 'Motion on' : 'Motion off'}</span>
            </button>
            <div className="topbar-source"><span className={`source-led ${query.isError ? 'offline' : ''}`} /><span>n8n feed</span><code>{metricsEndpoint.host}{metricsEndpoint.pathname}</code></div>
          </div>
        </header>

        <div className="page-wrap">
          <div className="card-shadow-shell"><section className="welcome-row">
            <div className="welcome-copy"><div className="eyebrow"><span className="eyebrow-line" /> A PERSONAL JOB SEARCH, IN ONE FEED</div><h1>A running record<br />of your search.</h1><p className="welcome-subtitle">Your n8n workflow finds roles, scores the fit, and prepares a tailored CV for each one.</p><button className="refresh-button" onClick={() => void query.refetch()} disabled={query.isFetching}><RefreshCw size={14} className={query.isFetching ? 'spin' : ''} />{query.isFetching ? 'Syncing metrics' : 'Sync metrics'}</button></div>
            <div className="hero-orbit" aria-hidden="true"><span className="orbit-label label-one">JOB FEED</span><span className="orbit-label label-two">{metrics?.unique_count_job_id.toLocaleString() ?? '—'} LISTINGS</span><span className="orbit-path orbit-path-one" /><span className="orbit-path orbit-path-two" /><span className="orbit-path orbit-path-three" /><span className="earth-atmosphere" /><span className="orbit-planet earth-planet"><svg className="earth-map" viewBox="0 0 100 100" aria-hidden="true"><path d="M14 25 21 17l11 2 5 7 9 1 4 7-8 5-1 9-7 2-5 12-8-2-3-10-7-4-5-11 3-10Zm47-10 9-4 11 4 2 7 10 5-4 9-8 3-2 10-8 2-4-9-7-3 1-10-6-7 6-7Zm-9 36 10 1 9 8-1 8-6 3-2 11-8 8-6-5 2-10-5-8 2-8-5-5Zm31 10 8 1 4 6-5 5-7-3Z" fill="currentColor" /></svg><span className="earth-cloud cloud-a" /><span className="earth-cloud cloud-b" /><span className="earth-glint" /></span><span className="orbit-moon moon-one" /><span className="orbit-satellite moon-two"><Satellite size={14} strokeWidth={1.7} /></span><span className="orbit-rocket"><Rocket size={18} strokeWidth={1.7} /></span><span className="orbit-star star-one" /><span className="orbit-star star-two" /><span className="orbit-star star-three" /><span className="orbit-star star-four" /></div>
          </section></div>

          {query.isError && <div className="error-banner" role="alert"><div><strong>We couldn’t reach your metrics workflow.</strong><span>{query.error.message} Check that n8n is running and allows requests from this page.</span></div><button onClick={() => void query.refetch()}>Try again <ArrowRight size={14} /></button></div>}

          <section className="section-heading" id="signals"><div><span className="section-kicker">SEARCH STATISTICS</span><h2>The dataset</h2></div><p className="section-caption">From the latest n8n metrics response</p></section>

          <section className="metric-grid" aria-label="Job search metrics">
            <div className="card-shadow-shell"><article className="metric-card jobs-card"><div className="metric-top"><span className="metric-icon mint-icon"><BriefcaseBusiness size={16} /></span><span className="metric-label">UNIQUE LISTINGS</span></div><div className="metric-number">{query.isPending ? <span className="skeleton short" /> : metrics?.unique_count_job_id.toLocaleString() ?? '—'}</div><div className="metric-foot"><span className="metric-caption">Distinct job IDs in the feed</span></div></article></div>

            <div className="card-shadow-shell"><article className="metric-card rating-card"><div className="metric-top"><span className="metric-icon violet-icon"><Target size={16} /></span><span className="metric-label">AVERAGE FIT SCORE</span></div><div className="metric-number">{query.isPending ? <span className="skeleton short" /> : metrics?.average_rating.toFixed(1) ?? '—'}<span className="out-of">/ 100</span></div><div className="rating-track" role="meter" aria-label="Average fit score" aria-valuemin={0} aria-valuemax={100} aria-valuenow={ratingPercent}><span style={{ width: `${ratingPercent}%` }} /></div><div className="metric-foot"><span className="metric-caption">Mean score across listings</span></div></article></div>

            <div className="card-shadow-shell metric-range-shell"><article className="metric-card range-card"><div className="metric-top"><span className="metric-icon amber-icon"><Activity size={16} /></span><span className="metric-label">SCORE SPREAD</span></div><div className="range-values"><div><span className="range-label">LOWEST</span><strong>{query.isPending ? '—' : metrics?.min_rating ?? '—'}</strong></div><span className="range-dash" /><div><span className="range-label">HIGHEST</span><strong>{query.isPending ? '—' : metrics?.max_rating ?? '—'}</strong></div></div><div className="metric-foot"><span className="metric-caption">Fit scores across the feed</span></div><div className="range-track" style={{ '--range-low': `${Math.min(100, Math.max(0, metrics?.min_rating ?? 0))}%`, '--range-high': `${Math.min(100, Math.max(0, metrics?.max_rating ?? 100))}%` } as CSSProperties}><span className="range-dot low" /><span className="range-fill" /><span className="range-dot high" /></div></article></div>
          </section>

          <section className="lower-grid">
            <div className="card-shadow-shell"><article className="panel insight-panel" id="workflow"><div className="panel-heading"><div><span className="section-kicker">THE PROCESS</span><h2>Three stages, one workflow</h2></div><span className="panel-index">01 — 03</span></div><div className="flow-steps"><div className="flow-step"><span className="flow-index">01</span><div className="flow-copy"><strong>Discover</strong><span>New listings enter the feed</span></div></div><span className="flow-connector" /><div className="flow-step"><span className="flow-index">02</span><div className="flow-copy"><strong>Score</strong><span>Ranked by fit</span></div></div><span className="flow-connector" /><div className="flow-step"><span className="flow-index">03</span><div className="flow-copy"><strong>Draft</strong><span>CV tailored to the role</span></div></div></div><div className="panel-note"><span>Each listing moves from discovery to a CV draft through your n8n workflow.</span></div></article></div>

            <div className="card-shadow-shell"><article className="panel sync-panel" id="feed"><div className="panel-heading"><div><span className="section-kicker">DATA FEED</span><h2>n8n metrics endpoint</h2></div><span className={`connection-check ${query.isError ? 'offline' : ''}`} aria-label={query.isError ? 'Disconnected' : 'Connected'}><span /></span></div><div className="feed-receipt"><span className="feed-receipt-label">{query.isError ? 'LAST REQUEST' : query.isFetching ? 'REQUEST IN PROGRESS' : query.isPending ? 'AWAITING FIRST RESPONSE' : 'LAST RESPONSE'}</span><strong>{query.isError ? 'Unable to connect' : query.isFetching ? 'Refreshing metrics' : query.isPending ? 'Waiting for data' : 'Received successfully'}</strong><time>{formatDate(metrics?.updatedAt)}</time></div><div className="sync-url"><span className="url-method">GET</span><code>{metricsEndpoint.pathname}</code><span className="feed-host">{metricsEndpoint.host}</span></div></article></div>
          </section>

          <footer className="page-footer"><span>Orbit · Job search workspace</span><span>Metrics refresh once a day</span></footer>
        </div>
      </main>
    </div>
  )
}

export default App
