import {
  BrainCircuit,
  CircleCheck,
  Database,
  FileText,
  GitBranch,
  Search,
  ShieldCheck,
  Timer,
} from 'lucide-react'
import WorkflowStage from './WorkflowStage'

const workflowStages = [
  {
    index: '01',
    title: 'Start the search',
    description: 'Run the workflow from n8n to load the job titles in your search profile.',
    detail: 'Titles are processed one at a time.',
    icon: Search,
    tone: 'stage-search',
  },
  {
    index: '02',
    title: 'Find and save listings',
    description: 'Search the JobTech job-search API for each title, then normalize and check each result against saved job IDs.',
    detail: 'New listings are stored once; duplicates are skipped.',
    icon: Database,
    tone: 'stage-collect',
  },
  {
    index: '03',
    title: 'Score the match',
    description: 'An AI model compares each new listing with your experience, skills, and frontend preference.',
    detail: 'Each job receives a 0–100 fit score.',
    icon: BrainCircuit,
    tone: 'stage-score',
  },
  {
    index: '04',
    title: 'Check the application gate',
    description: 'Rated jobs move forward only when their score is at least 40 and no application has been saved for that job.',
    detail: 'Below 40: no application is generated.',
    icon: GitBranch,
    tone: 'stage-gate',
  },
  {
    index: '05',
    title: 'Generate and record',
    description: 'The job and your profile are used to draft a tailored cover letter. The application is saved and the job status is updated.',
    detail: 'Errors are written to the workflow log.',
    icon: FileText,
    tone: 'stage-apply',
  },
]

export default function WorkflowPage() {
  return (
    <>
      <section className="workflow-intro">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> FROM SEARCH TO APPLICATION</div>
          <h1>One workflow,<br />from discovery to draft.</h1>
          <p className="welcome-subtitle">
            A clear view of how new job listings are found, scored, and turned into tailored cover letters.
          </p>
        </div>
        <div className="workflow-status">
          <span className="workflow-status-led" />
          <span>n8n automation</span>
          <strong>Manual start</strong>
        </div>
      </section>

      <section className="workflow-overview" aria-label="Job search workflow">
        <div className="workflow-section-heading">
          <div><span className="section-kicker">THE PIPELINE</span><h2>How a job moves through the system</h2></div>
          <span className="panel-index">5 STAGES</span>
        </div>
        <div className="workflow-stage-list">
          {workflowStages.map(({ index, ...stage }, stageIndex) => (
            <div className="workflow-stage-row" key={index}>
              <div className="workflow-rail" aria-hidden="true">
                <span>{index}</span>
                {stageIndex < workflowStages.length - 1 && <i />}
              </div>
              <WorkflowStage {...stage} />
            </div>
          ))}
        </div>
      </section>

      <section className="workflow-support-grid" aria-label="Workflow rules and data">
        <article className="workflow-support-card">
          <div className="workflow-support-heading">
            <span className="workflow-support-icon"><CircleCheck size={16} /></span>
            <div><span className="section-kicker">APPLICATION RULE</span><h2>Only promising, new matches</h2></div>
          </div>
          <p>Applications are prepared for jobs rated <strong>40 or higher</strong>, and only if an application for that job does not already exist.</p>
          <div className="threshold-bar" aria-label="Application threshold: 40 out of 100">
            <span className="threshold-range" />
            <i />
            <b>40</b>
          </div>
          <div className="threshold-labels"><span>0 · not a match yet</span><span>100 · strong fit</span></div>
        </article>

        <article className="workflow-support-card">
          <div className="workflow-support-heading">
            <span className="workflow-support-icon"><ShieldCheck size={16} /></span>
            <div><span className="section-kicker">BUILT-IN SAFEGUARDS</span><h2>Careful and traceable</h2></div>
          </div>
          <ul className="workflow-safeguards">
            <li><CircleCheck size={13} /> Existing job IDs are not inserted twice.</li>
            <li><CircleCheck size={13} /> Existing applications are not generated again.</li>
            <li><CircleCheck size={13} /> Errors are saved for review.</li>
          </ul>
          <div className="workflow-wait-note"><Timer size={13} /> Short waits pace requests between batches.</div>
        </article>
      </section>

      <section className="workflow-data-note">
        <Database size={15} />
        <p><strong>Three data tables keep the process connected:</strong> job titles guide searches, job records hold listing details and scores, and application records store generated materials.</p>
      </section>
    </>
  )
}
