import { ArrowUpRight, CreditCard } from 'lucide-react'

type Props = {
  title: string
  value: string
  change: string
  positive?: boolean
  icon: typeof CreditCard
  note: string
}

export default function StatCard({ title, value, change, positive, icon: Icon, note }: Props) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span>{title}</span>
        <span className="stat-icon"><Icon size={18} /></span>
      </div>
      <strong className="stat-value">{value}</strong>
      <div className="stat-bottom">
        <span className={`stat-change ${positive ? 'stat-change--positive' : ''}`}>
          {positive && <ArrowUpRight size={14} />}
          {change}
        </span>
        <span className="stat-note">{note}</span>
      </div>
    </article>
  )
}
