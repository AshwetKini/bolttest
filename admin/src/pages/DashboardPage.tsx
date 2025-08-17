import React from 'react'
import { useQuery } from 'react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Store } from 'lucide-react'
import { api } from '../services/api'
import { LoadingSpinner } from '../components/LoadingSpinner'

export function DashboardPage() {
  const { data: salesData, isLoading: salesLoading } = useQuery(
    'dashboard-sales',
    () => api.get('/reports/sales').then(res => res.data.data),
    { retry: 1 }
  )

  const { data: storesData, isLoading: storesLoading } = useQuery(
    'dashboard-stores',
    () => api.get('/stores').then(res => res.data.data),
    { retry: 1 }
  )

  const { data: ordersData, isLoading: ordersLoading } = useQuery(
    'dashboard-orders',
    () => api.get('/orders?limit=10').then(res => res.data.data),
    { retry: 1 }
  )

  if (salesLoading || storesLoading || ordersLoading) {
    return <LoadingSpinner />
  }

  const summary = salesData?.summary || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 }
  const dailyData = salesData?.dailyData || []
  const stores = storesData || []
  const orders = ordersData || []

  const stats = [
    {
      name: 'Total Revenue',
      value: `$${summary.totalRevenue?.toFixed(2) || '0.00'}`,
      change: '+12.3%',
      changeType: 'positive' as const,
      icon: DollarSign,
    },
    {
      name: 'Total Orders',
      value: summary.totalOrders?.toString() || '0',
      change: '+8.1%',
      changeType: 'positive' as const,
      icon: ShoppingCart,
    },
    {
      name: 'Active Stores',
      value: stores.filter((store: any) => store.status === 'active').length.toString(),
      change: '+2.4%',
      changeType: 'positive' as const,
      icon: Store,
    },
    {
      name: 'Avg Order Value',
      value: `$${summary.avgOrderValue?.toFixed(2) || '0.00'}`,
      change: '-3.2%',
      changeType: 'negative' as const,
      icon: Users,
    },
  ]

  const chartData = dailyData.map((item: any) => ({
    date: `${item._id.month}/${item._id.day}`,
    revenue: item.totalRevenue,
    orders: item.totalOrders,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your Shopee admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-8 w-8 text-primary-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.changeType === 'positive' ? (
                        <TrendingUp className="h-4 w-4 flex-shrink-0 self-center" />
                      ) : (
                        <TrendingDown className="h-4 w-4 flex-shrink-0 self-center" />
                      )}
                      <span className="ml-1">{stat.change}</span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Orders Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="orders" fill="#14b8a6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Store</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order: any) => (
                <tr key={order._id}>
                  <td className="font-mono text-sm">{order.orderNumber}</td>
                  <td>{order.customer?.name || 'N/A'}</td>
                  <td>{order.store?.name || 'N/A'}</td>
                  <td className="font-medium">${order.totalAmount?.toFixed(2)}</td>
                  <td>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}