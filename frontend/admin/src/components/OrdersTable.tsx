import { ChevronRight } from 'lucide-react'
import type { Order } from '../types'

export default function OrdersTable({ orders }: { orders: Order[] }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th><th /></tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td><strong>{order.id}</strong></td>
              <td>{order.customer}</td>
              <td>{order.date}</td>
              <td className="amount">{order.amount}</td>
              <td><span className={`status-pill status-${order.status.toLowerCase()}`}>{order.status}</span></td>
              <td><button className="row-action" aria-label={`View ${order.id}`} type="button"><ChevronRight size={17} /></button></td>
            </tr>
          ))}
          {orders.length === 0 && <tr><td colSpan={6} className="empty-row">No matching orders found.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

