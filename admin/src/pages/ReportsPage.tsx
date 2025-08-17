import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Download, Calendar } from 'lucide-react'
import { api } from '../services/api'
import { LoadingSpinner } from '../components/LoadingSpinner'

const COLORS = ['#3b82f6', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6']

export function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  const { data: salesData, isLoading: salesLoading } = useQuery(
    ['reports-sales', dateRange],
    () => api.get(`/reports/sales?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
      .then(res => res.data.data),
    { retry: 1 }
  )

  const { data: storePerformanceData, isLoading: storeLoading } = useQuery(
    ['reports-store-performance', dateRange],
    () => api.get(`/reports/store-performance?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
      .then(res => res.data.data),
    { retry: 1, enabled: false } // Disabled for store owners
  )

  const handleDownloadSalesCSV = async () => {
    try {
      const response = await api.get(`/reports/sales/csv?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
        responseType: 'blob',
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'sales-report.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Failed to download sales report:', error)
    }
  }

  const handleDownloadStorePerformanceCSV = async () => {
    try {
      const response = await api.get(`/reports/store-performance/csv?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
        responseType: 'blob',
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'store-performance-report.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Failed to download store performance report:', error)
    }
  }

  if (salesLoading || storeLoading) {
    return <LoadingSpinner />
  }

  const summary = salesData?.summary || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 }
  const dailyData = salesData?.dailyData || []
  const storeData = storePerformanceData || []

  const chartData = dailyData.map((item: any) => ({
    date: `${item._id.month}/${item._id.day}`,
    revenue: item.totalRevenue,
    orders: item.totalOrders,
  }))

  const pieChartData = storeData.slice(0, 5).map((store: any, index: number) => ({
    name: store.storeName,
    value: store.totalRevenue,
    color: COLORS[index % COLORS.length],
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Analytics and insights</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="input"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="text-sm font-medium text-gray-500">Total Revenue</div>
          <div className="text-2xl font-bold text-gray-900">${summary.totalRevenue.toFixed(2)}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm font-medium text-gray-500">Total Orders</div>
          <div className="text-2xl font-bold text-gray-900">{summary.totalOrders}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm font-medium text-gray-500">Average Order Value</div>
          <div className="text-2xl font-bold text-gray-900">${summary.avgOrderValue.toFixed(2)}</div>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Sales Trend</h3>
          <button
            onClick={handleDownloadSalesCSV}
            className="btn btn-secondary"
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </button>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value, name) => [
              name === 'revenue' ? `$${value}` : value,
              name === 'revenue' ? 'Revenue' : 'Orders'
            ]} />
            <Bar dataKey="revenue" fill="#3b82f6" name="revenue" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Store Performance */}
      {storeData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Store Performance Chart */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Top Performing Stores</h3>
              <button
                onClick={handleDownloadStorePerformanceCSV}
                className="btn btn-secondary"
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: $${value.toFixed(0)}`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Store Performance Table */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Store Performance Details</h3>
            </div>
            <div className="overflow-y-auto max-h-80">
              <table className="table">
                <thead>
                  <tr>
                    <th>Store</th>
                    <th>Revenue</th>
                    <th>Orders</th>
                    <th>AOV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {storeData.map((store: any) => (
                    <tr key={store._id}>
                      <td className="text-sm font-medium text-gray-900">
                        {store.storeName}
                      </td>
                      <td className="text-sm text-gray-900">
                        ${store.totalRevenue.toFixed(2)}
                      </td>
                      <td className="text-sm text-gray-900">
                        {store.totalOrders}
                      </td>
                      <td className="text-sm text-gray-900">
                        ${store.avgOrderValue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}