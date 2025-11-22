import React, { useState, useEffect } from 'react';
import apiClient from '../utils/axios';
import Header from '../components/Header';
import { FaCheckCircle, FaTimesCircle, FaEye, FaDownload, FaSpinner } from 'react-icons/fa';
import { getImageUrl } from '../utils/imageUrl';

const SuperAdminApplications = () => {
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: 'all', apiType: 'all' });
  const [reviewData, setReviewData] = useState({
    action: 'approve',
    reviewNotes: '',
    rejectionReason: '',
    qrApiKey: '',
    shippingApiKey: ''
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.status !== 'all') params.append('status', filter.status);
      if (filter.apiType !== 'all') params.append('apiType', filter.apiType);

      const response = await apiClient.get(`/api-applications/applications?${params.toString()}`);
      setApplications(response.data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      alert('Failed to fetch applications. You may not have super admin access.');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedApplication) return;

    if (reviewData.action === 'reject' && !reviewData.rejectionReason) {
      alert('Please provide a rejection reason');
      return;
    }

    if (reviewData.action === 'approve' && (selectedApplication.apiType === 'qr' || selectedApplication.apiType === 'both') && !reviewData.qrApiKey) {
      if (!confirm('No QR API Key provided. Continue without setting it?')) return;
    }

    if (reviewData.action === 'approve' && (selectedApplication.apiType === 'shipping' || selectedApplication.apiType === 'both') && !reviewData.shippingApiKey) {
      if (!confirm('No Shipping API Key provided. Continue without setting it?')) return;
    }

    try {
      setReviewing(true);
      await apiClient.put(`/api-applications/applications/${selectedApplication.id}/review`, reviewData);
      
      alert(`Application ${reviewData.action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      setShowReviewModal(false);
      setSelectedApplication(null);
      setReviewData({
        action: 'approve',
        reviewNotes: '',
        rejectionReason: '',
        qrApiKey: '',
        shippingApiKey: ''
      });
      fetchApplications();
    } catch (error) {
      console.error('Error reviewing application:', error);
      alert(error.response?.data?.message || 'Failed to review application');
    } finally {
      setReviewing(false);
    }
  };

  const openReviewModal = (application) => {
    setSelectedApplication(application);
    setReviewData({
      action: 'approve',
      reviewNotes: '',
      rejectionReason: '',
      qrApiKey: application.qrApiKey || '',
      shippingApiKey: application.shippingApiKey || ''
    });
    setShowReviewModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const downloadDocument = (path, filename) => {
    if (!path) return;
    const url = getImageUrl(path);
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">API Applications Review</h1>
          <p className="text-gray-600 mt-1">Review and approve/reject API access applications</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={filter.apiType}
              onChange={(e) => setFilter({ ...filter, apiType: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All API Types</option>
              <option value="qr">QR API</option>
              <option value="shipping">Shipping API</option>
              <option value="both">Both</option>
            </select>
          </div>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            <FaSpinner className="animate-spin mx-auto mb-2" size={32} />
            <p>Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            <p>No applications found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {app.apiType === 'both' ? 'QR & Shipping API' : 
                         app.apiType === 'qr' ? 'QR API' : 'Shipping API'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                        {app.status.replace('_', ' ').charAt(0).toUpperCase() + app.status.replace('_', ' ').slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      <strong>Store:</strong> {app.Store?.storeName || 'N/A'}
                      <span className="mx-2">•</span>
                      <strong>Applicant:</strong> {app.applicant?.firstName} {app.applicant?.lastName} ({app.applicant?.email})
                    </p>
                  </div>
                  <button
                    onClick={() => openReviewModal(app)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      app.status === 'pending' || app.status === 'under_review'
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                    disabled={app.status === 'approved' || app.status === 'rejected'}
                  >
                    {app.status === 'approved' || app.status === 'rejected' ? 'Reviewed' : 'Review'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Business Name</p>
                    <p className="text-sm font-medium text-gray-900">{app.businessName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Contact Number</p>
                    <p className="text-sm font-medium text-gray-900">{app.contactNumber}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Business Address</p>
                    <p className="text-sm font-medium text-gray-900">{app.businessAddress}</p>
                  </div>
                </div>

                {/* Documents */}
                {(app.birDocument || app.businessPermit || app.validId || app.otherDocuments) && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 mb-2">Documents:</p>
                    <div className="flex flex-wrap gap-2">
                      {app.birDocument && (
                        <button
                          onClick={() => downloadDocument(app.birDocument, 'BIR Document')}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 flex items-center gap-1"
                        >
                          <FaDownload size={12} />
                          BIR Document
                        </button>
                      )}
                      {app.businessPermit && (
                        <button
                          onClick={() => downloadDocument(app.businessPermit, 'Business Permit')}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 flex items-center gap-1"
                        >
                          <FaDownload size={12} />
                          Business Permit
                        </button>
                      )}
                      {app.validId && (
                        <button
                          onClick={() => downloadDocument(app.validId, 'Valid ID')}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 flex items-center gap-1"
                        >
                          <FaDownload size={12} />
                          Valid ID
                        </button>
                      )}
                      {app.otherDocuments && Array.isArray(app.otherDocuments) && app.otherDocuments.map((doc, index) => (
                        <button
                          key={index}
                          onClick={() => downloadDocument(doc, `Document ${index + 1}`)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 flex items-center gap-1"
                        >
                          <FaDownload size={12} />
                          Other Doc {index + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Submitted: {new Date(app.createdAt).toLocaleString()}
                  {app.reviewedAt && (
                    <> • Reviewed: {new Date(app.reviewedAt).toLocaleString()}</>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Review Application</h2>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action *</label>
                <select
                  value={reviewData.action}
                  onChange={(e) => setReviewData({ ...reviewData, action: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="approve">Approve</option>
                  <option value="reject">Reject</option>
                  <option value="under_review">Mark as Under Review</option>
                </select>
              </div>

              {reviewData.action === 'approve' && (
                <>
                  {(selectedApplication.apiType === 'qr' || selectedApplication.apiType === 'both') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        QR API Key <span className="text-xs text-gray-500">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={reviewData.qrApiKey}
                        onChange={(e) => setReviewData({ ...reviewData, qrApiKey: e.target.value })}
                        placeholder="Enter QR API key to automatically add to store"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}

                  {(selectedApplication.apiType === 'shipping' || selectedApplication.apiType === 'both') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Shipping API Key (Google Maps) <span className="text-xs text-gray-500">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={reviewData.shippingApiKey}
                        onChange={(e) => setReviewData({ ...reviewData, shippingApiKey: e.target.value })}
                        placeholder="Enter Google Maps API key to automatically add to store"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}
                </>
              )}

              {reviewData.action === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rejection Reason * <span className="text-xs text-red-500">(Required)</span>
                  </label>
                  <textarea
                    required
                    value={reviewData.rejectionReason}
                    onChange={(e) => setReviewData({ ...reviewData, rejectionReason: e.target.value })}
                    rows="4"
                    placeholder="Please provide a reason for rejection..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Review Notes <span className="text-xs text-gray-500">(Internal - Optional)</span>
                </label>
                <textarea
                  value={reviewData.reviewNotes}
                  onChange={(e) => setReviewData({ ...reviewData, reviewNotes: e.target.value })}
                  rows="3"
                  placeholder="Internal notes (not visible to applicant)..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReview}
                  disabled={reviewing || (reviewData.action === 'reject' && !reviewData.rejectionReason)}
                  className={`flex-1 px-4 py-2 rounded-lg text-white font-medium flex items-center justify-center gap-2 ${
                    reviewData.action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                >
                  {reviewing ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {reviewData.action === 'approve' ? <FaCheckCircle /> : <FaTimesCircle />}
                      {reviewData.action === 'approve' ? 'Approve' : 'Reject'} Application
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminApplications;

