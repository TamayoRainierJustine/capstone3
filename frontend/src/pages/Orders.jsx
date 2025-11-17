import React, { useState, useEffect } from 'react';
import apiClient from '../utils/axios';
import Header from '../components/Header';
import { FaCopy, FaCheck } from 'react-icons/fa';
import { regions, getProvincesByRegion, getCityMunByProvince, getBarangayByMun } from 'phil-reg-prov-mun-brgy';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [copiedRef, setCopiedRef] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentTransactionId, setPaymentTransactionId] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const url = selectedStatus === 'all'
        ? '/orders'
        : `/orders?status=${selectedStatus}`;

      const response = await apiClient.get(url);

      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await apiClient.put(
        `/orders/${orderId}/status`,
        { status: newStatus }
      );

      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const updatePaymentStatus = async (orderId, newPaymentStatus, transactionId = null) => {
    try {
      const token = localStorage.getItem('token');
      await apiClient.put(
        `/orders/${orderId}/payment`,
        { 
          paymentStatus: newPaymentStatus,
          paymentTransactionId: transactionId || undefined
        }
      );

      setEditingPayment(null);
      setPaymentTransactionId('');
      fetchOrders();
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status');
    }
  };

  const copyReferenceNumber = (refNumber) => {
    navigator.clipboard.writeText(refNumber);
    setCopiedRef(refNumber);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      preparing: 'bg-blue-100 text-blue-800', // Alias for processing
      shipped: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      processing: 'Preparing',
      preparing: 'Preparing',
      shipped: 'To Be Shipped',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const deleteOrder = async (orderId) => {
    const confirmDelete = window.confirm('Are you sure you want to permanently delete this order? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to manage orders.');
        return;
      }

      await apiClient.delete(`/orders/${orderId}`);
      // Refresh list after deletion
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      const message = error.response?.data?.message || 'Failed to delete order';
      alert(message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600 mt-1">Manage customer orders</p>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Preparing</option>
            <option value="shipped">To Be Shipped</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">No orders found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">Order #{order.orderNumber}</h3>
                    <div className="mt-2 bg-purple-50 border-2 border-purple-300 rounded-lg px-4 py-3 inline-block">
                      <p className="text-xs font-medium text-purple-700 mb-1">Transaction Reference Number:</p>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-bold text-purple-900 font-mono">{order.orderNumber}</p>
                        <button
                          onClick={() => copyReferenceNumber(order.orderNumber)}
                          className="p-1.5 hover:bg-purple-100 rounded transition-colors"
                          title="Copy reference number"
                        >
                          {copiedRef === order.orderNumber ? (
                            <FaCheck className="text-green-600" size={14} />
                          ) : (
                            <FaCopy className="text-purple-600" size={14} />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-purple-600 mt-1">Use this number to verify customer payments</p>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {new Date(order.createdAt).toLocaleDateString()} at{' '}
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="mb-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Order Status</label>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 ${getStatusColor(order.status)} cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 hover:opacity-90 transition-opacity`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Preparing</option>
                        <option value="shipped">To Be Shipped</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="mb-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Payment Status</label>
                      {editingPayment === order.id ? (
                        <div className="space-y-2">
                          <select
                            value={order.paymentStatus}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              if (newStatus === 'completed') {
                                // If marking as completed, use the transaction ID if provided
                                updatePaymentStatus(order.id, newStatus, paymentTransactionId || order.paymentTransactionId || null);
                              } else {
                                updatePaymentStatus(order.id, newStatus);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 ${getPaymentStatusColor(order.paymentStatus)} cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500`}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                          </select>
                          <div className="mt-2">
                            <input
                              type="text"
                              placeholder="Payment Transaction ID (e.g., GCash reference)"
                              value={paymentTransactionId}
                              onChange={(e) => setPaymentTransactionId(e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  updatePaymentStatus(order.id, 'completed', paymentTransactionId);
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500 mt-1">Enter the transaction ID from GCash/PayPal receipt</p>
                            <button
                              onClick={() => updatePaymentStatus(order.id, 'completed', paymentTransactionId)}
                              className="mt-2 w-full px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                              Mark Payment as Completed
                            </button>
                          </div>
                          <button
                            onClick={() => {
                              setEditingPayment(null);
                              setPaymentTransactionId('');
                            }}
                            className="w-full px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(order.paymentStatus)} mb-1`}>
                            {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                          </p>
                          {order.paymentStatus === 'pending' && (
                            <button
                              onClick={() => {
                                setEditingPayment(order.id);
                                setPaymentTransactionId(order.paymentTransactionId || '');
                              }}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                              Verify Payment
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {order.paymentMethod && (
                      <p className="text-xs text-gray-600 mt-1">
                        Method: {order.paymentMethod.toUpperCase()}
                      </p>
                    )}
                    {order.paymentTransactionId && (
                      <p className="text-xs text-gray-500 mt-1 break-all max-w-xs">
                        TXN: {order.paymentTransactionId}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    <strong>Customer:</strong> {order.customerName} ({order.customerEmail})
                  </p>
                  {order.customerPhone && (
                    <p className="text-sm text-gray-600">
                      <strong>Phone:</strong> {order.customerPhone}
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Items:</h4>
                  <div className="space-y-2">
                    {order.OrderItems && order.OrderItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.Product?.name} x {item.quantity}
                        </span>
                        <span>₱{parseFloat(item.subtotal).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-600">
                      Subtotal: ₱{parseFloat(order.subtotal).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Shipping: ₱{parseFloat(order.shipping).toFixed(2)}
                    </p>
                    <p className="text-lg font-bold text-purple-600">
                      Total: ₱{parseFloat(order.total).toFixed(2)}
                    </p>
                  </div>
                  {order.status === 'cancelled' && (
                    <button
                      onClick={() => deleteOrder(order.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                    >
                      Delete Order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;

