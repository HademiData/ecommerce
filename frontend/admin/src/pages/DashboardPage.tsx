import { ArrowDownRight, ArrowUpRight, CreditCard, Package, ShoppingCart, Users } from 'lucide-react'
import StatCard from '../components/StatCard'
import OrdersTable from '../components/OrdersTable'
import type { Order } from '../types'

const money = (amount: number) => new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 2,
}).format(amount)

export default function DashboardPage({
  orders,
  customerCount,
  productCount,
  onViewOrders,
}: {
  orders: Order[]
  customerCount: number
  productCount: number
  onViewOrders: () => void
}) {
  const revenue = orders
    .filter(order => order.status.toLowerCase() !== 'cancelled')
    .reduce((total, order) => total + (Number(order.amount) || 0), 0)

  return (
    <>
      <section className="stats-grid">
        <StatCard title="Total revenue" value={money(revenue)} change="From non-cancelled orders" icon={CreditCard} note="Based on current order records" />
        <StatCard title="Total orders" value={String(orders.length)} change="Database records" positive icon={ShoppingCart} note="All orders returned by the service" />
        <StatCard title="Customers" value={String(customerCount)} change="Registered customers" icon={Users} note="From the user service" />
        <StatCard title="Products" value={String(productCount)} change="Inventory records" icon={Package} note="From the product service" />
      </section>

      <section className="dashboard-grid">
        <div className="panel revenue-panel">
          <div className="panel-heading"><div><h2>Revenue overview</h2><p>Revenue calculated from non-cancelled orders.</p></div></div>
          <div className="chart-summary"><strong>{money(revenue)}</strong><span>Total from loaded order records</span></div>
          <div className="analytics-note"><ArrowUpRight size={22} /><p>This is a current total, not a historical revenue chart. Payment confirmation is not yet included.</p></div>
        </div>
        <div className="panel activity-panel">
          <div className="panel-heading"><div><h2>Order status</h2><p>Current order breakdown</p></div></div>
          <div className="status-legend">
            <div>Orders loaded <strong>{orders.length}</strong></div>
            <div>Confirmed <strong>{orders.filter(o => o.status.toLowerCase() === 'confirmed').length}</strong></div>
            <div>Pending <strong>{orders.filter(o => o.status.toLowerCase() === 'pending').length}</strong></div>
            <div>Cancelled <strong>{orders.filter(o => o.status.toLowerCase() === 'cancelled').length}</strong></div>
          </div>
        </div>
      </section>

      <section className="panel orders-panel">
        <div className="panel-heading"><div><h2>Recent orders</h2><p>Orders returned by the database.</p></div><button className="text-button" onClick={onViewOrders}>View all orders <ArrowDownRight size={16} /></button></div>
        <OrdersTable orders={orders.slice(0, 5)} />
      </section>
    </>
  )
}
