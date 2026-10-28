import { ChevronDown, ChevronRight } from 'lucide-react'
import { Fragment } from 'react'
import { useState } from 'react'
import type { Order } from '../types'

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const money = (amount: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 2,
    }).format(amount)

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th><th>Contents</th></tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order.id

            return (
              <Fragment key={order.id}>
                <tr>
                  <td><strong>{order.id}</strong></td>
                  <td>{order.customer}</td>
                  <td>{order.date}</td>
                  <td className="amount">{money(Number(order.amount) || 0)}</td>
                  <td><span className={`status-pill status-${order.status.toLowerCase()}`}>{order.status}</span></td>
                  <td>
                    <button
                      className="row-action order-details-toggle"
                      aria-label={`${isExpanded ? 'Hide' : 'View'} contents for order ${order.id}`}
                      aria-expanded={isExpanded}
                      type="button"
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    >
                      {isExpanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                      <span>{isExpanded ? 'Hide' : 'View items'}</span>
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="order-contents-row">
                    <td colSpan={6}>
                      <div className="order-contents">
                        <h3>Order contents</h3>
                        {order.items.length > 0 ? (
                          <div className="order-contents-list">
                            {order.items.map((item) => (
                              <div className="order-content-item" key={item.id}>
                                <div>
                                  <strong>{item.name}</strong>
                                  <span>Qty {item.quantity} × {money(item.unitPrice)}</span>
                                </div>
                                <strong>{money(item.quantity * item.unitPrice)}</strong>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="order-contents-empty">No item details were returned for this order.</p>
                        )}
                        <div className="order-contents-total">
                          <span>Order total</span>
                          <strong>{money(Number(order.amount) || 0)}</strong>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
          {orders.length === 0 && <tr><td colSpan={6} className="empty-row">No matching orders found.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
