import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../utils/axios';
import LanguageToggle from '../components/LanguageToggle';
import { FaPaperPlane, FaPlus, FaSpinner } from 'react-icons/fa';

const HelpChat = () => {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    message: '',
    category: 'general',
    priority: 'medium',
    storeId: ''
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
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchTicketMessages(selectedTicket.id);
      // Auto-scroll to bottom when new messages arrive
      scrollToBottom();
    }
  }, [selectedTicket, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/support/tickets/my');
      setTickets(response.data);
      if (response.data.length > 0 && !selectedTicket) {
        setSelectedTicket(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
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
        message: newMessage
      });
      setNewMessage('');
      await fetchTicketMessages(selectedTicket.id);
      await fetchTickets(); // Refresh ticket list to update lastRepliedAt
    } catch (error) {
      console.error('Error sending message:', error);
      alert(t('ticketing.failedToSend'));
    } finally {
      setSending(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.message) {
      alert(t('ticketing.pleaseFill'));
      return;
    }

    try {
      await apiClient.post('/support/tickets', newTicket);
      setShowNewTicketModal(false);
      setNewTicket({
        subject: '',
        message: '',
        category: 'general',
        priority: 'medium',
        storeId: ''
      });
      await fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert(t('ticketing.failedToCreate'));
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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center relative z-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('ticketing.title')}</h1>
            <p className="text-gray-600 mt-1">{t('ticketing.subtitle')}</p>
          </div>
          <div className="flex items-center gap-4 relative" style={{ zIndex: 1000 }}>
            <LanguageToggle />
            <button
              onClick={() => setShowNewTicketModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <FaPlus />
              {t('ticketing.newTicket')}
            </button>
          </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">{t('ticketing.myTickets')}</h2>
            </div>
            <div className="overflow-y-auto max-h-[600px]">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <FaSpinner className="animate-spin mx-auto mb-2" />
                  <p>{t('ticketing.loadingTickets')}</p>
                </div>
              ) : tickets.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>{t('ticketing.noTickets')}</p>
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
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedTicket.subject}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedTicket.status)}`}>
                          {translateStatus(selectedTicket.status)}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                          {translatePriority(selectedTicket.priority)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {t('ticketing.created')}: {new Date(selectedTicket.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '400px' }}>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.userId === selectedTicket.userId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.userId === selectedTicket.userId
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="text-xs font-semibold mb-1">
                          {message.User.firstName} {message.User.lastName}
                          {message.isInternal && ` (${t('ticketing.internalNote')})`}
                        </div>
                        <div className="text-sm whitespace-pre-wrap">{message.message}</div>
                        <div className={`text-xs mt-1 ${
                          message.userId === selectedTicket.userId ? 'text-purple-100' : 'text-gray-500'
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
                  <p className="text-sm">{t('ticketing.orCreateNew')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">{t('ticketing.createNewTicket')}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('ticketing.subject')} *</label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={t('ticketing.subjectPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('ticketing.category')}</label>
                <select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="general">{t('ticketing.categoryOptions.general')}</option>
                  <option value="technical">{t('ticketing.categoryOptions.technical')}</option>
                  <option value="billing">{t('ticketing.categoryOptions.billing')}</option>
                  <option value="api_application">{t('ticketing.categoryOptions.apiApplication')}</option>
                  <option value="other">{t('ticketing.categoryOptions.other')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('ticketing.priority')}</label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="low">{t('ticketing.priorityOptions.low')}</option>
                  <option value="medium">{t('ticketing.priorityOptions.medium')}</option>
                  <option value="high">{t('ticketing.priorityOptions.high')}</option>
                  <option value="urgent">{t('ticketing.priorityOptions.urgent')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('ticketing.message')} *</label>
                <textarea
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  rows="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={t('ticketing.messagePlaceholder')}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNewTicketModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  {t('ticketing.cancel')}
                </button>
                <button
                  onClick={handleCreateTicket}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {t('ticketing.createTicket')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpChat;

