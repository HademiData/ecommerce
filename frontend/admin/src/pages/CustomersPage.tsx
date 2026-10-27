import type { Customer } from '../types'

export default function CustomersPage({
  customers,
  loading,
  error,
}: {
  customers: Customer[]
  loading: boolean
  error: string
}) {
  return (
    <section className="panel orders-panel">
      <div className="panel-heading"><div><h2>Customers</h2><p>Registered customer accounts from the user database.</p></div></div>
      {loading && <p className="analytics-note">Loading customers...</p>}
      {error && <p className="analytics-note">{error}</p>}
      {!loading && !error && customers.length === 0 && <p className="analytics-note">No customers found.</p>}
      {!loading && !error && customers.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px' }}>Customer</th>
                <th style={{ padding: '12px' }}>Email</th>
                <th style={{ padding: '12px' }}>Orders</th>
                <th style={{ padding: '12px' }}>Total spent</th>
                <th style={{ padding: '12px' }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer.id}>
                  <td style={{ padding: '12px' }}>{customer.name}</td>
                  <td style={{ padding: '12px' }}>{customer.email}</td>
                  <td style={{ padding: '12px' }}>{customer.orders}</td>
                  <td style={{ padding: '12px' }}>{customer.spent}</td>
                  <td style={{ padding: '12px' }}>{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
