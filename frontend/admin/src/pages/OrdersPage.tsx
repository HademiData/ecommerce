import OrdersTable from '../components/OrdersTable'
import type { Order } from '../types'

export default function OrdersPage({
  orders,
  loading,
  error,
}: {
  orders: Order[]
  loading: boolean
  error: string
}) {
  return (
    <section className="panel orders-panel">
      <div className="panel-heading"><div><h2>Orders</h2><p>Orders retrieved from the database.</p></div></div>
      {loading && <p className="analytics-note">Loading orders...</p>}
      {error && <p className="analytics-note">{error}</p>}
      {!loading && !error && orders.length === 0 && <p className="analytics-note">No orders found.</p>}
      {!loading && !error && orders.length > 0 && <OrdersTable orders={orders} />}
    </section>
  )
}
