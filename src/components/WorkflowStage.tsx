import type { LucideIcon } from 'lucide-react'

type WorkflowStageProps = {
  description: string
  detail: string
  icon: LucideIcon
  title: string
  tone: string
}

export default function WorkflowStage({
  description,
  detail,
  icon: Icon,
  title,
  tone,
}: WorkflowStageProps) {
  return (
    <article className={`workflow-stage ${tone}`}>
      <span className="workflow-stage-icon"><Icon size={18} /></span>
      <div className="workflow-stage-copy">
        <h3>{title}</h3>
        <p>{description}</p>
        <span className="workflow-stage-detail">{detail}</span>
      </div>
    </article>
  )
}
