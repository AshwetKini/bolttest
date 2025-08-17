import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { Search, Plus, Eye, Edit, MoreHorizontal } from 'lucide-react'
import { api } from '../services/api'
import { LoadingSpinner } from '../components/LoadingSpinner'

export function StoresPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: stores = [], isLoading, refetch } = useQuery(
    ['stores', searchTerm, statusFilter],
    () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      
      return api.get(`/stores?${params.toString()}`).then(res => res.data.data)
    },
    { retry: 1 }
  )

  const handleStatusChange = async (storeId: string, action: 'activate' | 'deactivate') => {
    try {
      await api.patch(`/stores/${storeId}/${action}`)
      refetch()
    } catch (error) {
      console.error('Failed to update store status:', error)
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stores</h1>
          <p className="text-gray-600">Manage stores and their information</p>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Store
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
                placeholder="Search stores..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stores Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Store Name</th>
                <th>Owner</th>
                <th>Phone</th>
                <th>Location</th>
                <th>Status</th>
                <th>Subscription</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stores.map((store: any) => (
                <tr key={store._id}>
                  <td>
                    <div>
                      <div className="font-medium text-gray-900">{store.name}</div>
                      <div className="text-sm text-gray-500">{store.description}</div>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">
                      <div className="text-gray-900">{store.ownerId?.name || 'N/A'}</div>
                      <div className="text-gray-500">{store.ownerId?.phone}</div>
                    </div>
                  </td>
                  <td className="text-sm text-gray-900">{store.phone}</td>
                  <td className="text-sm text-gray-500">
                    {store.city}, {store.state}
                  </td>
                  <td>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      store.status === 'active' ? 'bg-green-100 text-green-800' :
                      store.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {store.status}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm text-gray-900 capitalize">
                      {store.subscriptionPlan}
                    </span>
                  </td>
                  <td className="text-sm text-gray-500">
                    {new Date(store.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button className="text-gray-400 hover:text-gray-600">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Edit className="w-4 h-4" />
                      </button>
                      <div className="relative group">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <div className="py-1">
                            {store.status === 'active' ? (
                              <button
                                onClick={() => handleStatusChange(store._id, 'deactivate')}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(store._id, 'activate')}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                Activate
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {stores.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No stores found
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