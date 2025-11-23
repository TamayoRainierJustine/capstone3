import React, { useState, useEffect } from 'react';
import apiClient from '../utils/axios';
import Header from '../components/Header';
import { FaCopy, FaCheck, FaEye, FaTimes, FaClock, FaSpinner, FaCheckCircle, FaTimesCircle, FaUndo } from 'react-icons/fa';
import { regions, getProvincesByRegion, getCityMunByProvince, getBarangayByMun } from 'phil-reg-prov-mun-brgy';
import { getImageUrl } from '../utils/imageUrl';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [copiedRef, setCopiedRef] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentTransactionId, setPaymentTransactionId] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(null);
  
  // Chat state
  const [showChatSection, setShowChatSection] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sendingChatMessage, setSendingChatMessage] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchOrders();
    fetchUnreadCount();
  }, [selectedStatus]);

  // Fetch chat conversations
  const fetchConversations = async () => {
    try {
      setChatLoading(true);
      const response = await apiClient.get('/chat/store/conversations');
      setConversations(response.data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setChatLoading(false);
    }
  };

  // Fetch messages for a specific customer
  const fetchCustomerMessages = async (customerId) => {
    try {
      setChatLoading(true);
      const response = await apiClient.get(`/chat/store/conversations/${customerId}/messages`);
      setChatMessages(response.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setChatLoading(false);
    }
  };

  // Send message to customer
  const sendStoreMessage = async () => {
    if (!newChatMessage.trim() || !selectedConversation) return;
    
    try {
      setSendingChatMessage(true);
      await apiClient.post('/chat/store/messages', {
        customerId: selectedConversation.customerId,
        message: newChatMessage.trim()
      });
      
      setNewChatMessage('');
      await fetchCustomerMessages(selectedConversation.customerId);
      await fetchConversations();
      await fetchUnreadCount();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingChatMessage(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await apiClient.get('/chat/store/unread-count');
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Auto-refresh chat when section is open
  useEffect(() => {
    if (showChatSection) {
      fetchConversations();
      const interval = setInterval(() => {
        fetchConversations();
        if (selectedConversation) {
          fetchCustomerMessages(selectedConversation.customerId);
        }
        fetchUnreadCount();
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [showChatSection, selectedConversation]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchCustomerMessages(selectedConversation.customerId);
    }
  }, [selectedConversation]);

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

  const handleCancellationRequest = async (orderId, action) => {
    try {
      const token = localStorage.getItem('token');
      await apiClient.put(
        `/orders/${orderId}/cancellation`,
        { action } // 'approve' or 'reject'
      );

      fetchOrders();
    } catch (error) {
      console.error('Error handling cancellation request:', error);
      alert(error.response?.data?.message || 'Failed to handle cancellation request');
    }
  };

  const updatePaymentStatus = async (orderId, newPaymentStatus, transactionId = null, notes = null) => {
    try {
      const token = localStorage.getItem('token');
      await apiClient.put(
        `/orders/${orderId}/payment`,
        { 
          paymentStatus: newPaymentStatus,
          paymentTransactionId: transactionId || undefined,
          verificationNotes: notes !== null ? notes : undefined
        }
      );

      setEditingPayment(null);
      setPaymentTransactionId('');
      setVerificationNotes('');
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
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      processing: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      failed: 'bg-red-100 text-red-800 border-red-300',
      refunded: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FaClock className="inline mr-1" size={12} />;
      case 'processing':
        return <FaSpinner className="inline mr-1 animate-spin" size={12} />;
      case 'completed':
        return <FaCheckCircle className="inline mr-1" size={12} />;
      case 'failed':
        return <FaTimesCircle className="inline mr-1" size={12} />;
      case 'refunded':
        return <FaUndo className="inline mr-1" size={12} />;
      default:
        return null;
    }
  };

  const getPaymentStatusLabel = (status) => {
    const labels = {
      pending: 'Pending Payment',
      processing: 'Processing Payment',
      completed: 'Payment Verified',
      failed: 'Payment Failed',
      refunded: 'Refunded'
    };
    return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
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
          <div className="flex gap-3 items-center">
            <button
              onClick={() => {
                setShowChatSection(!showChatSection);
                if (!showChatSection) {
                  fetchConversations();
                }
              }}
              className="relative px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Customer Messages
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
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
        </div>

        {/* Chat Section */}
        {showChatSection && (
          <div className="mb-8 bg-white rounded-lg shadow-md">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Customer Messages</h2>
              <p className="text-sm text-gray-600 mt-1">Chat with your customers about products, orders, and shipping</p>
            </div>
            <div className="flex" style={{ height: '600px' }}>
              {/* Conversations List */}
              <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
                {chatLoading && conversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">Loading conversations...</div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <p>No conversations yet.</p>
                    <p className="text-sm mt-2">Customers can start chatting from your store page.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {conversations.map((conv) => (
                      <button
                        key={conv.customerId}
                        onClick={() => setSelectedConversation(conv)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                          selectedConversation?.customerId === conv.customerId ? 'bg-purple-50 border-l-4 border-purple-600' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-semibold text-gray-900">
                            {conv.customer?.firstName} {conv.customer?.lastName}
                          </div>
                          {conv.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <div className="text-sm text-gray-600 truncate">
                            {conv.lastMessage.message}
                          </div>
                        )}
                        {conv.lastMessage && (
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Messages Area */}
              <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                      <h3 className="font-semibold text-gray-900">
                        {selectedConversation.customer?.firstName} {selectedConversation.customer?.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{selectedConversation.customer?.email}</p>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                      {chatLoading && chatMessages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">Loading messages...</div>
                      ) : chatMessages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          <p>No messages yet.</p>
                          <p className="text-sm mt-2">Start the conversation!</p>
                        </div>
                      ) : (
                        chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.senderType === 'store_owner' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                msg.senderType === 'store_owner'
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-white text-gray-800 border border-gray-200'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                              <p className={`text-xs mt-1 ${msg.senderType === 'store_owner' ? 'text-purple-100' : 'text-gray-500'}`}>
                                {new Date(msg.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-gray-200 bg-white">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          sendStoreMessage();
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="text"
                          value={newChatMessage}
                          onChange={(e) => setNewChatMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          disabled={sendingChatMessage}
                        />
                        <button
                          type="submit"
                          disabled={!newChatMessage.trim() || sendingChatMessage}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {sendingChatMessage ? (
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          )}
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      <p>Select a conversation to start chatting</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">Order #{order.orderNumber}</h3>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium border-2 flex items-center gap-1 ${getPaymentStatusColor(order.paymentStatus)}`}>
                        {getPaymentStatusIcon(order.paymentStatus)}
                        <span>{getPaymentStatusLabel(order.paymentStatus)}</span>
                      </div>
                    </div>
                    {order.paymentReference && (
                      <div className="mt-2 bg-purple-50 border-2 border-purple-300 rounded-lg px-4 py-3 inline-block">
                        <p className="text-xs font-medium text-purple-700 mb-1">Transaction Reference Number:</p>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-bold text-purple-900 font-mono">{order.paymentReference}</p>
                          <button
                            onClick={() => copyReferenceNumber(order.paymentReference)}
                            className="p-1.5 hover:bg-purple-100 rounded transition-colors"
                            title="Copy reference number"
                          >
                            {copiedRef === order.paymentReference ? (
                              <FaCheck className="text-green-600" size={14} />
                            ) : (
                              <FaCopy className="text-purple-600" size={14} />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-purple-600 mt-1">Buyer's payment reference number</p>
                      </div>
                    )}
                    {order.paymentReceipt && (
                      <div className="mt-2 bg-green-50 border-2 border-green-300 rounded-lg px-4 py-3 inline-block">
                        <p className="text-xs font-medium text-green-700 mb-2">Payment Receipt:</p>
                        <div className="flex items-center gap-2">
                          <img 
                            src={getImageUrl(order.paymentReceipt)} 
                            alt="Payment receipt" 
                            className="w-20 h-20 object-cover rounded border border-green-400 cursor-pointer hover:opacity-80"
                            onClick={() => setShowReceiptModal(order.paymentReceipt)}
                          />
                          <button
                            onClick={() => setShowReceiptModal(order.paymentReceipt)}
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center gap-1"
                          >
                            <FaEye size={12} />
                            View Full Size
                          </button>
                        </div>
                        <p className="text-xs text-green-600 mt-1">Click to view full receipt</p>
                      </div>
                    )}
                    {!order.paymentReference && !order.paymentReceipt && (
                      <div className="mt-2 bg-gray-50 border-2 border-gray-300 rounded-lg px-4 py-3 inline-block">
                        <p className="text-xs font-medium text-gray-700 mb-1">Order Number:</p>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-bold text-gray-900 font-mono">{order.orderNumber}</p>
                          <button
                            onClick={() => copyReferenceNumber(order.orderNumber)}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            title="Copy order number"
                          >
                            {copiedRef === order.orderNumber ? (
                              <FaCheck className="text-green-600" size={14} />
                            ) : (
                              <FaCopy className="text-gray-600" size={14} />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">No payment reference provided by buyer</p>
                      </div>
                    )}
                    {/* Cancellation Request Status */}
                    {order.cancellationRequest && order.cancellationRequest !== 'none' && (
                      <div className="mt-2 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                        <p className="text-xs font-medium text-yellow-800 mb-1">
                          Cancellation Request: <span className="capitalize">{order.cancellationRequest}</span>
                        </p>
                        {order.cancellationReason && (
                          <p className="text-xs text-yellow-700 mt-1">
                            <strong>Reason:</strong> {order.cancellationReason}
                          </p>
                        )}
                        {order.cancellationRequest === 'requested' && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleCancellationRequest(order.id, 'approve')}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                              Approve Cancellation
                            </button>
                            <button
                              onClick={() => handleCancellationRequest(order.id, 'reject')}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                            >
                              Reject Request
                            </button>
                          </div>
                        )}
                      </div>
                    )}
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
                                updatePaymentStatus(order.id, newStatus, paymentTransactionId || order.paymentTransactionId || null, verificationNotes || order.verificationNotes || '');
                              } else {
                                updatePaymentStatus(order.id, newStatus, null, verificationNotes || order.verificationNotes || '');
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
                                  updatePaymentStatus(order.id, 'completed', paymentTransactionId, verificationNotes || '');
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500 mt-1">Enter the transaction ID from GCash/PayPal receipt</p>
                            <textarea
                              placeholder="Verification Notes (optional)"
                              value={editingPayment === order.id ? (verificationNotes || order.verificationNotes || '') : ''}
                              onChange={(e) => setVerificationNotes(e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded mt-2"
                              rows="2"
                            />
                            <p className="text-xs text-gray-500 mt-1">Add notes about payment verification</p>
                            <button
                              onClick={() => updatePaymentStatus(order.id, 'completed', paymentTransactionId, verificationNotes || '')}
                              className="mt-2 w-full px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                              Mark Payment as Completed
                            </button>
                          </div>
                          <button
                            onClick={() => {
                              setEditingPayment(null);
                              setPaymentTransactionId('');
                              setVerificationNotes('');
                            }}
                            className="w-full px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 ${getPaymentStatusColor(order.paymentStatus)} mb-1 flex items-center justify-center gap-1`}>
                          {getPaymentStatusIcon(order.paymentStatus)}
                          <span>{getPaymentStatusLabel(order.paymentStatus)}</span>
                        </div>
                          {order.paymentStatus === 'pending' && (
                            <button
                              onClick={() => {
                                setEditingPayment(order.id);
                                setPaymentTransactionId(order.paymentTransactionId || '');
                                setVerificationNotes(order.verificationNotes || '');
                              }}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                              Verify Payment
                            </button>
                          )}
                          {order.verificationNotes && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                              <p className="font-medium text-blue-800 mb-1">Verification Notes:</p>
                              <p className="text-blue-700">{order.verificationNotes}</p>
                            </div>
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
                    {/* Cancellation Request Status */}
                    {order.cancellationRequest && order.cancellationRequest !== 'none' && (
                      <div className="mt-2 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                        <p className="text-xs font-medium text-yellow-800 mb-1">
                          Cancellation Request: <span className="capitalize">{order.cancellationRequest}</span>
                        </p>
                        {order.cancellationReason && (
                          <p className="text-xs text-yellow-700 mt-1">
                            <strong>Reason:</strong> {order.cancellationReason}
                          </p>
                        )}
                        {order.cancellationRequest === 'requested' && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleCancellationRequest(order.id, 'approve')}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                              Approve Cancellation
                            </button>
                            <button
                              onClick={() => handleCancellationRequest(order.id, 'reject')}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                            >
                              Reject Request
                            </button>
                          </div>
                        )}
                      </div>
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
                  {order.shippingAddress && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">Shipping Address:</p>
                      <p className="text-sm text-gray-600">
                        {(() => {
                          const addr = order.shippingAddress;
                          // Use names if available, otherwise convert codes to names
                          let regionName = addr.regionName;
                          let provinceName = addr.provinceName;
                          let municipalityName = addr.municipalityName;
                          let barangayName = addr.barangayName || addr.barangay;
                          
                          // If names not available, try to convert codes
                          if (!regionName && addr.region) {
                            const region = regions.find(r => r.reg_code === addr.region);
                            regionName = region?.name || addr.region;
                          }
                          if (!provinceName && addr.province && addr.region) {
                            const provinces = getProvincesByRegion(addr.region);
                            const province = provinces.find(p => p.prov_code === addr.province);
                            provinceName = province?.name || addr.province;
                          }
                          if (!municipalityName && addr.municipality && addr.province) {
                            const municipalities = getCityMunByProvince(addr.province);
                            const municipality = municipalities.find(m => m.mun_code === addr.municipality);
                            municipalityName = municipality?.name || addr.municipality;
                          }
                          
                          const addressParts = [];
                          if (barangayName) addressParts.push(barangayName);
                          if (municipalityName) addressParts.push(municipalityName);
                          if (provinceName) addressParts.push(provinceName);
                          if (regionName) addressParts.push(regionName);
                          
                          return addressParts.join(', ') || 'Address not available';
                        })()}
                      </p>
                    </div>
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

      {/* Payment Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowReceiptModal(null)}>
          <div className="bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-auto relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowReceiptModal(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <FaTimes size={24} />
            </button>
            <h3 className="text-lg font-semibold mb-4">Payment Receipt</h3>
            <img 
              src={getImageUrl(showReceiptModal)} 
              alt="Payment receipt" 
              className="max-w-full h-auto rounded border border-gray-300"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;

