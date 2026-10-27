import { useEffect, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import './App.css'
import type { Customer, Order, Page } from './types'
import { useAuth } from './hooks/useAuth'
import { useProducts } from './hooks/useProducts'
import { getAdminOrders } from './services/orderService'
import { getAdminCustomers } from './services/customerService'
import type { ApiOrder } from './services/orderService'
import type { ApiCustomer } from './services/customerService'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import OrdersPage from './pages/OrdersPage'
import CustomersPage from './pages/CustomersPage'
import AnalyticsPage from './pages/AnalyticsPage'
import DiscountsPage from './pages/DiscountsPage'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'

function mapOrder(order: ApiOrder, customerNames: Map<string, string>): Order {
  return {
    id: order.id,
    customer: customerNames.get(order.userId) ?? 'Customer',
    date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—',
    amount: String(order.totalAmount ?? 0),
    status: order.status,
  }
}

export default function App() {
  const auth = useAuth()
  const [page, setPage] = useState<Page>('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [apiOrders, setApiOrders] = useState<ApiOrder[]>([])
  const [apiCustomers, setApiCustomers] = useState<ApiCustomer[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [customersLoading, setCustomersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')
  const [customersError, setCustomersError] = useState('')

  const { products, productsLoading, productsError, refreshProducts } = useProducts(auth.loggedIn)

  useEffect(() => {
    if (!auth.loggedIn || !auth.accessToken) {
      setApiOrders([])
      setApiCustomers([])
      return
    }

    let active = true
    setOrdersLoading(true)
    setCustomersLoading(true)
    setOrdersError('')
    setCustomersError('')

    getAdminOrders(auth.accessToken)
      .then(data => {
        if (active) setApiOrders(data)
      })
      .catch(error => {
        if (active) setOrdersError(error instanceof Error ? error.message : 'Failed to load orders.')
      })
      .finally(() => {
        if (active) setOrdersLoading(false)
      })

    getAdminCustomers(auth.accessToken)
      .then(data => {
        if (active) setApiCustomers(data)
      })
      .catch(error => {
        if (active) setCustomersError(error instanceof Error ? error.message : 'Failed to load customers.')
      })
      .finally(() => {
        if (active) setCustomersLoading(false)
      })

    return () => {
      active = false
    }
  }, [auth.loggedIn, auth.accessToken])

  const customerNames = useMemo(
    () => new Map(
      apiCustomers.map((customer) => [
        customer.id,
        [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email,
      ]),
    ),
    [apiCustomers],
  )

  const orders = useMemo(
    () => apiOrders.map((order) => mapOrder(order, customerNames)).filter((order, index) =>
      `${order.id} ${apiOrders[index].userId} ${order.customer} ${order.status}`
        .toLowerCase()
        .includes(search.toLowerCase())
    ),
    [apiOrders, customerNames, search],
  )

  const customers = useMemo(() => {
    const orderTotals = new Map<string, { count: number; spent: number }>()
    for (const order of apiOrders) {
      const current = orderTotals.get(order.userId) ?? { count: 0, spent: 0 }
      current.count += 1
      if (order.status.toLowerCase() !== 'cancelled') {
        current.spent += Number(order.totalAmount) || 0
      }
      orderTotals.set(order.userId, current)
    }

    return apiCustomers.map((customer): Customer => {
      const totals = orderTotals.get(customer.id) ?? { count: 0, spent: 0 }
      return {
        id: customer.id,
        name: [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email,
        email: customer.email,
        orders: totals.count,
        spent: new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: 'NGN',
          maximumFractionDigits: 2,
        }).format(totals.spent),
        createdAt: customer.createdAt,
        emailVerified: customer.emailVerified,
      }
    })
  }, [apiCustomers, apiOrders])

  if (!auth.isReady) {
    return <main className="auth-loading" role="status">Checking your admin session...</main>
  }

  if (!auth.loggedIn) {
    return <LoginPage
      email={auth.email}
      setEmail={auth.setEmail}
      password={auth.password}

      
      setPassword={auth.setPassword}
      error={auth.loginError}
      isSubmitting={auth.isSubmitting}
      onSubmit={auth.handleLogin}
    />
  }

  return (
    <div className="admin-app">
      <Sidebar page={page} setPage={setPage} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} adminName={auth.adminName} onLogout={() => void auth.handleLogout()} />
      <main className="admin-main">
        <Topbar page={page} adminName={auth.adminName} search={search} setSearch={setSearch} onMenu={() => setSidebarOpen(true)} />
        <div className="page-content">
          <div className="page-heading">
            <div><span className="eyebrow">STORE MANAGEMENT</span><h1>{page === 'Dashboard' ? 'Good morning.' : page}</h1><p>{page === 'Dashboard' ? 'Your store overview.' : `Review and manage your store ${page.toLowerCase()}.`}</p></div>
            <div className="heading-actions"><span className="demo-badge">LIVE DATA</span><button className="date-button" type="button">Today <ChevronDown size={15} /></button></div>
          </div>

          {page === 'Dashboard' && (
            <>
              {(ordersError || customersError || productsError) && (
                <p className="analytics-note">{[ordersError, customersError, productsError].filter(Boolean).join(' ')}</p>
              )}
              {(ordersLoading || customersLoading || productsLoading) && <p className="analytics-note">Loading store data...</p>}
              <DashboardPage
                orders={orders}
                customerCount={apiCustomers.length}
                productCount={products.length}
                onViewOrders={() => setPage('Orders')}
              />
            </>
          )}
          {page === 'Products' && (
            <ProductsPage
              products={products}
              loading={productsLoading}
              error={productsError}
              search={search}
              accessToken={auth.accessToken}
              onProductsChanged={refreshProducts}
            />
          )}
          {page === 'Orders' && <OrdersPage orders={orders} loading={ordersLoading} error={ordersError} />}
          {page === 'Customers' && <CustomersPage customers={customers} loading={customersLoading} error={customersError} />}
          {page === 'Analytics' && <AnalyticsPage />}
          {page === 'Discounts' && <DiscountsPage />}

        </div>
      </main>
    </div>
  )
}
