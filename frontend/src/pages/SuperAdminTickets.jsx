import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../utils/axios';
import Header from '../components/Header';
import LanguageToggle from '../components/LanguageToggle';
import { useAuth } from '../context/AuthContext';
import { FaPaperPlane, FaSpinner, FaFilter, FaHome } from 'react-icons/fa';

const SuperAdminTickets = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    priority: 'all'
  });
  const messagesEndRef = useRef(null);

  const translateStatus = (status) => {
    const statusMap = {
      'open': t('ticketing.status.open'),
      'in_progress': t('ticketing.status.inProgress'),
      'resolved': t('ticketing.status.resolved'),
      'closed': t('ticketing.status.closed')
    };
    return statusMap[status] || status;
  };

  const translatePriority = (priority) => {
    const priorityMap = {
      'low': t('ticketing.priorityOptions.low'),
      'medium': t('ticketing.priorityOptions.medium'),
      'high': t('ticketing.priorityOptions.high'),
      'urgent': t('ticketing.priorityOptions.urgent')
    };
    return priorityMap[priority] || priority;
  };

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  useEffect(() => {
    if (selectedTicket) {
      fetchTicketMessages(selectedTicket.id);
      scrollToBottom();
    }
  }, [selectedTicket, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.priority !== 'all') params.append('priority', filters.priority);

      const response = await apiClient.get(`/support/tickets?${params.toString()}`);
      setTickets(response.data || []);
      if (response.data.length > 0 && !selectedTicket) {
        setSelectedTicket(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      alert(t('ticketing.failedToFetch'));
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketMessages = async (ticketId) => {
    try {
      const response = await apiClient.get(`/support/tickets/${ticketId}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      setSending(true);
      await apiClient.post(`/support/tickets/${selectedTicket.id}/messages`, {
        message: newMessage,
        isInternal: false
      });
      setNewMessage('');
      await fetchTicketMessages(selectedTicket.id);
      await fetchTickets();
    } catch (error) {
      console.error('Error sending message:', error);
      alert(t('ticketing.failedToSend'));
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      const response = await apiClient.put(`/support/tickets/${ticketId}/status`, {
        status: newStatus
      });
      await fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(response.data);
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      alert(t('ticketing.failedToUpdate'));
    }
  };

  const handleAssignToMe = async (ticketId) => {
    if (!user || !user.id) {
      alert(t('ticketing.userNotAvailable'));
      return;
    }
    
    try {
      await apiClient.put(`/support/tickets/${ticketId}/status`, {
        assignedTo: user.id
      });
      await fetchTickets();
    } catch (error) {
      console.error('Error assigning ticket:', error);
      alert(t('ticketing.failedToAssign'));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('ticketing.supportTickets')}</h1>
            <p className="text-gray-600 mt-1">{t('ticketing.supportTicketsSubtitle')}</p>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <Link
              to="/super-admin"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <FaHome />
              {t('ticketing.backToDashboard')}
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4 items-center">
            <FaFilter className="text-gray-500" />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">{t('ticketing.status.all')}</option>
              <option value="open">{t('ticketing.status.open')}</option>
              <option value="in_progress">{t('ticketing.status.inProgress')}</option>
              <option value="resolved">{t('ticketing.status.resolved')}</option>
              <option value="closed">{t('ticketing.status.closed')}</option>
            </select>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">{t('ticketing.categoryOptions.all')}</option>
              <option value="general">{t('ticketing.categoryOptions.general')}</option>
              <option value="technical">{t('ticketing.categoryOptions.technical')}</option>
              <option value="billing">{t('ticketing.categoryOptions.billing')}</option>
              <option value="api_application">{t('ticketing.categoryOptions.apiApplication')}</option>
              <option value="other">{t('ticketing.categoryOptions.other')}</option>
            </select>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">{t('ticketing.priorityOptions.all')}</option>
              <option value="low">{t('ticketing.priorityOptions.low')}</option>
              <option value="medium">{t('ticketing.priorityOptions.medium')}</option>
              <option value="high">{t('ticketing.priorityOptions.high')}</option>
              <option value="urgent">{t('ticketing.priorityOptions.urgent')}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">{t('ticketing.allTickets')} ({tickets.length})</h2>
            </div>
            <div className="overflow-y-auto max-h-[600px]">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <FaSpinner className="animate-spin mx-auto mb-2" />
                  <p>{t('ticketing.loadingTickets')}</p>
                </div>
              ) : tickets.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>{t('ticketing.noTicketsFound')}</p>
                </div>
              ) : (
                tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                      selectedTicket?.id === ticket.id ? 'bg-purple-50 border-purple-300' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm">{ticket.subject}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                        {translateStatus(ticket.status)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {t('ticketing.from')}: {ticket.creator?.firstName} {ticket.creator?.lastName} ({ticket.creator?.email})
                    </p>
                    <p className="text-xs text-gray-500 mb-2">{ticket.message.substring(0, 60)}...</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className={`px-2 py-0.5 rounded ${getPriorityColor(ticket.priority)}`}>
                        {translatePriority(ticket.priority)}
                      </span>
                      <span>•</span>
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow flex flex-col">
            {selectedTicket ? (
              <>
                <div className="p-4 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900">{selectedTicket.subject}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedTicket.status)}`}>
                          {translateStatus(selectedTicket.status)}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                          {translatePriority(selectedTicket.priority)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {t('ticketing.from')}: {selectedTicket.creator?.firstName} {selectedTicket.creator?.lastName} ({selectedTicket.creator?.email})
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAssignToMe(selectedTicket.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        {t('ticketing.assignToMe')}
                      </button>
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="open">{t('ticketing.status.open')}</option>
                        <option value="in_progress">{t('ticketing.status.inProgress')}</option>
                        <option value="resolved">{t('ticketing.status.resolved')}</option>
                        <option value="closed">{t('ticketing.status.closed')}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '400px' }}>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.userId === selectedTicket.userId ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.userId === selectedTicket.userId
                            ? 'bg-gray-100 text-gray-900'
                            : 'bg-purple-600 text-white'
                        }`}
                      >
                        <div className="text-xs font-semibold mb-1">
                          {message.User.firstName} {message.User.lastName}
                          {message.User.role === 'super_admin' && ` (${t('ticketing.superAdmin')})`}
                          {message.isInternal && ` (${t('ticketing.internalNote')})`}
                        </div>
                        <div className="text-sm whitespace-pre-wrap">{message.message}</div>
                        <div className={`text-xs mt-1 ${
                          message.userId === selectedTicket.userId ? 'text-gray-500' : 'text-purple-100'
                        }`}>
                          {new Date(message.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={t('ticketing.typeMessage')}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {sending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                      {t('ticketing.send')}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <p className="text-lg mb-2">{t('ticketing.selectTicket')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminTickets;

