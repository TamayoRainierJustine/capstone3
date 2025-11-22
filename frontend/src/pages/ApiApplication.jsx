import React, { useState, useEffect } from 'react';
import apiClient from '../utils/axios';
import Header from '../components/Header';
import { FaFileUpload, FaCheckCircle, FaTimesCircle, FaClock, FaSpinner } from 'react-icons/fa';
import { getImageUrl } from '../utils/imageUrl';

const ApiApplication = () => {
  const [applications, setApplications] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [formData, setFormData] = useState({
    storeId: '',
    apiType: 'qr',
    businessName: '',
    businessAddress: '',
    contactNumber: '',
    email: ''
  });
  const [files, setFiles] = useState({
    birDocument: null,
    businessPermit: null,
    validId: null,
    otherDocuments: []
  });
  const [filePreviews, setFilePreviews] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchApplications();
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await apiClient.get('/stores');
      setStores(response.data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api-applications/my');
      setApplications(response.data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (field, event) => {
    const file = event.target.files[0];
    if (file) {
      setFiles(prev => ({
        ...prev,
        [field]: field === 'otherDocuments' ? [...prev.otherDocuments, file] : file
      }));

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreviews(prev => ({
            ...prev,
            [field]: reader.result
          }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeFile = (field) => {
    setFiles(prev => ({
      ...prev,
      [field]: field === 'otherDocuments' ? [] : null
    }));
    setFilePreviews(prev => {
      const newPreviews = { ...prev };
      delete newPreviews[field];
      return newPreviews;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.storeId || !formData.businessName || !formData.businessAddress || !formData.contactNumber || !formData.email) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const submitData = new FormData();
      
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });

      if (files.birDocument) submitData.append('birDocument', files.birDocument);
      if (files.businessPermit) submitData.append('businessPermit', files.businessPermit);
      if (files.validId) submitData.append('validId', files.validId);
      files.otherDocuments.forEach((file, index) => {
        submitData.append('otherDocuments', file);
      });

      await apiClient.post('/api-applications/applications', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Application submitted successfully! We will review it and get back to you soon.');
      setShowApplicationForm(false);
      setFormData({
        storeId: '',
        apiType: 'qr',
        businessName: '',
        businessAddress: '',
        contactNumber: '',
        email: ''
      });
      setFiles({
        birDocument: null,
        businessPermit: null,
        validId: null,
        otherDocuments: []
      });
      setFilePreviews({});
      fetchApplications();
    } catch (error) {
      console.error('Error submitting application:', error);
      alert(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <FaCheckCircle className="text-green-600" />;
      case 'rejected':
        return <FaTimesCircle className="text-red-600" />;
      case 'under_review':
        return <FaSpinner className="animate-spin text-blue-600" />;
      default:
        return <FaClock className="text-yellow-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">API Applications</h1>
            <p className="text-gray-600 mt-1">Apply for QR API and Shipping API access</p>
          </div>
          <button
            onClick={() => setShowApplicationForm(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <FaFileUpload />
            New Application
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            <FaSpinner className="animate-spin mx-auto mb-2" size={32} />
            <p>Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">No applications yet.</p>
            <button
              onClick={() => setShowApplicationForm(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Create Your First Application
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {app.apiType === 'both' ? 'QR & Shipping API' : 
                       app.apiType === 'qr' ? 'QR API' : 'Shipping API'}
                    </h3>
                    <p className="text-sm text-gray-500">Store: {app.Store?.storeName || 'N/A'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(app.status)}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                      {app.status.replace('_', ' ').charAt(0).toUpperCase() + app.status.replace('_', ' ').slice(1)}
                    </span>
                  </div>
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

                {app.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</p>
                    <p className="text-sm text-red-700">{app.rejectionReason}</p>
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

      {/* Application Form Modal */}
      {showApplicationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Apply for API Access</h2>
                <button
                  onClick={() => setShowApplicationForm(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store * <span className="text-xs text-gray-500">(Required)</span>
                  </label>
                  <select
                    required
                    value={formData.storeId}
                    onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select Store</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>{store.storeName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Type * <span className="text-xs text-gray-500">(Required)</span>
                  </label>
                  <select
                    required
                    value={formData.apiType}
                    onChange={(e) => setFormData({ ...formData, apiType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="qr">QR API Only</option>
                    <option value="shipping">Shipping API Only</option>
                    <option value="both">Both QR & Shipping API</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name * <span className="text-xs text-gray-500">(Required)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Your registered business name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Address * <span className="text-xs text-gray-500">(Required)</span>
                </label>
                <textarea
                  required
                  value={formData.businessAddress}
                  onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Complete business address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number * <span className="text-xs text-gray-500">(Required)</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="09XX XXX XXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email * <span className="text-xs text-gray-500">(Required)</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="business@email.com"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Required Documents</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      BIR Document (PDF/Image) <span className="text-xs text-gray-500">(Recommended)</span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange('birDocument', e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {files.birDocument && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm text-gray-600">{files.birDocument.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile('birDocument')}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Permit (PDF/Image) <span className="text-xs text-gray-500">(Recommended)</span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange('businessPermit', e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {files.businessPermit && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm text-gray-600">{files.businessPermit.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile('businessPermit')}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valid ID (PDF/Image) <span className="text-xs text-gray-500">(Recommended)</span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange('validId', e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {files.validId && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm text-gray-600">{files.validId.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile('validId')}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Other Documents (PDF/Image) <span className="text-xs text-gray-500">(Optional)</span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      onChange={(e) => {
                        Array.from(e.target.files).forEach(file => {
                          handleFileChange('otherDocuments', { target: { files: [file] } });
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {files.otherDocuments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {files.otherDocuments.map((file, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setFiles(prev => ({
                                  ...prev,
                                  otherDocuments: prev.otherDocuments.filter((_, i) => i !== index)
                                }));
                              }}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> All documents will be reviewed by our team. We will contact you once your application is reviewed. 
                    Make sure all documents are clear and valid.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowApplicationForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiApplication;

