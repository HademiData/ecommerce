import { Activity, CreditCard, Users, ArrowUpRight } from 'lucide-react'
import StatCard from '../components/StatCard'

export default function AnalyticsPage() {
  return <section className="stats-grid analytics-grid">
    <StatCard title="Revenue" value="—" change="Not available" icon={CreditCard} note="Requires order totals" />
    <StatCard title="Conversion rate" value="—" change="Not available" icon={ArrowUpRight} note="Requires visit and sales data" />
    <StatCard title="Returning customers" value="—" change="Not available" icon={Users} note="Requires customer history" />
    <div className="panel analytics-note"><Activity size={22} /><h2>Store analytics</h2><p>These metrics will be calculated when the backend exposes the required order and customer data.</p></div>
  </section>
}
