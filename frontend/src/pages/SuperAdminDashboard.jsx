import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../utils/axios';
import Header from '../components/Header';
import { FaStore, FaUsers, FaShoppingCart, FaDollarSign, FaEye, FaToggleOn, FaToggleOff, FaTrash } from 'react-icons/fa';

const SuperAdminDashboard = () => {
  const [stores, setStores] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, published, unpublished

  useEffect(() => {
    fetchStatistics();
    fetchStores();
  }, [statusFilter, searchTerm]);

  const fetchStatistics = async () => {
    try {
      const response = await apiClient.get('/admin/statistics');
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchStores = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await apiClient.get(`/admin/stores?${params.toString()}`);
      setStores(response.data);
    } catch (error) {
      console.error('Error fetching stores:', error);
      alert('Failed to fetch stores. You may not have super admin access.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStoreStatus = async (storeId, currentStatus) => {
    try {
      await apiClient.put(`/admin/stores/${storeId}/status`, {
        isPublished: !currentStatus
      });
      fetchStores();
      fetchStatistics();
    } catch (error) {
      console.error('Error updating store status:', error);
      alert('Failed to update store status');
    }
  };

  const handleDeleteStore = async (storeId, storeName) => {
    if (!confirm(`Sigurado ka bang gusto mong tanggalin ang "${storeName}"? Ang lahat ng products, orders, at data nito ay mabubura na.\n\nHindi ito pwedeng i-undo!`)) {
      return;
    }

    try {
      await apiClient.delete(`/admin/stores/${storeId}`);
      alert('Store deleted successfully');
      fetchStores();
      fetchStatistics();
    } catch (error) {
      console.error('Error deleting store:', error);
      alert(error.response?.data?.message || 'Failed to delete store');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage all stores and system administration</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/super-admin/tickets"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              📧 Support Tickets
            </Link>
            <Link
              to="/super-admin/applications"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              📋 API Applications
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Stores</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalStores}</p>
                </div>
                <FaStore className="text-3xl text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Published</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.publishedStores}</p>
                </div>
                <FaToggleOn className="text-3xl text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Unpublished</p>
                  <p className="text-2xl font-bold text-yellow-600">{statistics.unpublishedStores}</p>
                </div>
                <FaToggleOff className="text-3xl text-yellow-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Store Owners</p>
                  <p className="text-2xl font-bold text-purple-600">{statistics.totalUsers}</p>
                </div>
                <FaUsers className="text-3xl text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">₱{statistics.totalRevenue.toFixed(2)}</p>
                </div>
                <FaDollarSign className="text-3xl text-green-500" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search stores by name or domain..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Stores</option>
                <option value="published">Published</option>
                <option value="unpublished">Unpublished</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stores Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">All Stores</h2>
          </div>
          
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <p>Loading stores...</p>
            </div>
          ) : stores.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p>No stores found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stores.map((store) => (
                    <tr key={store.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{store.storeName}</div>
                        {store.description && (
                          <div className="text-sm text-gray-500">{store.description.substring(0, 50)}...</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{store.domainName}</div>
                        {store.status === 'published' && (
                          <a
                            href={`/published/${store.domainName}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <FaEye size={12} />
                            View Store
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {store.User ? (
                          <div>
                            <div className="text-sm text-gray-900">
                              {store.User.firstName} {store.User.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{store.User.email}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          store.status === 'published'
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {store.status === 'published' ? 'Published' : 'Unpublished'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(store.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2 items-center">
                          <button
                            onClick={() => handleToggleStoreStatus(store.id, store.status === 'published')}
                            className={`px-3 py-1 rounded ${
                              store.status === 'published'
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          >
                            {store.status === 'published' ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            onClick={() => handleDeleteStore(store.id, store.storeName)}
                            className="px-3 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200 flex items-center gap-1"
                            title="Delete Store"
                          >
                            <FaTrash size={12} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;

