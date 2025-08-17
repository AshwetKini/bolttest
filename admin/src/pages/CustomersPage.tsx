import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { Search, Plus, Eye, Edit } from 'lucide-react'
import { api } from '../services/api'
import { LoadingSpinner } from '../components/LoadingSpinner'

export function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [storeFilter, setStoreFilter] = useState('all')

  const { data: customers = [], isLoading } = useQuery(
    ['customers', searchTerm, storeFilter],
    () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (storeFilter !== 'all') params.append('storeId', storeFilter)
      
      return api.get(`/customers?${params.toString()}`).then(res => res.data.data)
    },
    { retry: 1 }
  )

  const { data: stores = [] } = useQuery(
    'stores-for-customer-filter',
    () => api.get('/stores').then(res => res.data.data),
    { retry: 1 }
  )

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage customer information and history</p>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </button>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search customers..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <select
              className="input"
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
            >
              <option value="all">All Stores</option>
              {stores.map((store: any) => (
                <option key={store._id} value={store._id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Location</th>
                <th>Total Orders</th>
                <th>Total Spent</th>
                <th>Last Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers.map((customer: any) => (
                <tr key={customer._id}>
                  <td>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {customer.name?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {customer.gender && (
                            <span className="capitalize">{customer.gender}</span>
                          )}
                          {customer.dateOfBirth && (
                            <span className="ml-2">
                              {new Date(customer.dateOfBirth).getFullYear()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm text-gray-900">{customer.phone}</td>
                  <td className="text-sm text-gray-900">{customer.email || 'N/A'}</td>
                  <td className="text-sm text-gray-500">
                    {customer.city ? `${customer.city}, ${customer.state}` : 'N/A'}
                  </td>
                  <td className="text-sm text-gray-900">{customer.totalOrders || 0}</td>
                  <td className="text-sm text-gray-900 font-medium">
                    ${(customer.totalSpent || 0).toFixed(2)}
                  </td>
                  <td className="text-sm text-gray-500">
                    {customer.lastOrderAt 
                      ? new Date(customer.lastOrderAt).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button className="text-gray-400 hover:text-gray-600">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No customers found
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