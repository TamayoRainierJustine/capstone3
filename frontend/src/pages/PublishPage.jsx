import React, { useState, useEffect } from 'react';
import apiClient from '../utils/axios';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';

const PublishPage = () => {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await apiClient.get('/stores');

        if (response.data && response.data.length > 0) {
          setStore(response.data[0]);
        } else {
          setError('No store found. Please create a store first.');
        }
      } catch (error) {
        console.error('Error fetching store:', error);
        setError('Failed to fetch store information.');
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [navigate]);

  // Debug: Log store status
  useEffect(() => {
    if (store) {
      console.log('🔍 Store status debug:', {
        status: store.status,
        statusType: typeof store.status,
        statusLower: store.status?.toLowerCase(),
        isPublished: store.status?.toLowerCase() === 'published',
        domainName: store.domainName
      });
    }
  }, [store]);

  const handlePublish = async (status) => {
    if (!store) return;

    setPublishing(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await apiClient.put(
        `/stores/${store.id}/publish`,
        { status }
      );

      setStore(response.data.store);
      setSuccess(
        status === 'published'
          ? 'Your website has been published successfully!'
          : 'Your website has been unpublished.'
      );
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError(
        error.response?.data?.message || 'Failed to publish/unpublish website.'
      );
      setTimeout(() => setError(''), 5000);
    } finally {
      setPublishing(false);
    }
  };

  const getWebsiteUrl = () => {
    if (!store) {
      console.log('🔍 getWebsiteUrl: no store');
      return null;
    }
    // Check for both lowercase and capitalized status
    const isPublished = store.status === 'published' || store.status === 'Published';
    if (!isPublished) {
      console.log('🔍 getWebsiteUrl: not published', { status: store?.status });
      return null;
    }
    if (!store.domainName) {
      console.log('🔍 getWebsiteUrl: no domainName');
      return null;
    }
    // URL encode the domain name to handle spaces and special characters
    const encodedDomain = encodeURIComponent(store.domainName);
    // Use current window location to get the correct port
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/published/${encodedDomain}`;
    console.log('🔍 getWebsiteUrl: returning', url);
    return url;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-2">Publish Your Website</h1>
          <p className="text-gray-600 mb-8">
            Make your website live or take it offline
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {success}
            </div>
          )}

          {store && (
            <div className="space-y-6">
              {/* Store Information */}
              <div className="border-b pb-6">
                <h2 className="text-xl font-semibold mb-4">Store Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Store Name</p>
                    <p className="font-medium">{store.storeName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Domain</p>
                    <p className="font-medium">{store.domainName}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Access at: {window.location.origin}/published/{store.domainName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        store.status && store.status.toLowerCase() === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {store.status && store.status.toLowerCase() === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Publish Status */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Publication Status</h3>
                {(() => {
                  const isPublished = store.status && (store.status.toLowerCase() === 'published' || store.status === 'Published');
                  console.log('🔍 Publication Status Check:', { 
                    status: store.status, 
                    isPublished,
                    storeExists: !!store 
                  });
                  return isPublished;
                })() && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-green-700">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="font-medium">Your website is live!</span>
                    </div>
                    {getWebsiteUrl() && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">Your website URL (share this with customers):</p>
                        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-3">
                          <a
                            href={getWebsiteUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-700 font-medium break-all flex-1"
                          >
                            {getWebsiteUrl()}
                          </a>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(getWebsiteUrl());
                              setSuccess('URL copied to clipboard!');
                              setTimeout(() => setSuccess('Your website has been published successfully!'), 2000);
                            }}
                            className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm font-medium"
                            title="Copy URL"
                          >
                            📋 Copy
                          </button>
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-2 mb-4">
                          💡 <strong>Tip:</strong> This URL is free and works immediately. Customers can visit and buy products right away!
                        </p>
                      </div>
                    )}
                    
                    {/* Social Media Sharing Buttons */}
                    {store?.domainName && (() => {
                      // Construct URL directly from store.domainName since we're in published block
                      const websiteUrl = `${window.location.origin}/published/${encodeURIComponent(store.domainName)}`;
                      const shareTitle = store?.storeName || 'Check out my store!';
                      
                      const shareToFacebook = () => {
                        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(websiteUrl)}`;
                        window.open(facebookUrl, 'facebook-share-dialog', 'width=626,height=436');
                      };
                      
                      const shareToInstagram = () => {
                        // Instagram doesn't support direct URL sharing, so we copy the URL and open Instagram
                        navigator.clipboard.writeText(websiteUrl).then(() => {
                          alert('Store URL copied to clipboard! Open Instagram and paste it in your story or post.');
                          window.open('https://www.instagram.com/', '_blank');
                        }).catch(() => {
                          // Fallback if clipboard fails
                          const textArea = document.createElement('textarea');
                          textArea.value = websiteUrl;
                          document.body.appendChild(textArea);
                          textArea.select();
                          document.execCommand('copy');
                          document.body.removeChild(textArea);
                          alert('Store URL copied to clipboard! Open Instagram and paste it in your story or post.');
                          window.open('https://www.instagram.com/', '_blank');
                        });
                      };
                      
                      const copyShareLink = async () => {
                        try {
                          await navigator.clipboard.writeText(websiteUrl);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        } catch (err) {
                          const textArea = document.createElement('textarea');
                          textArea.value = websiteUrl;
                          document.body.appendChild(textArea);
                          textArea.select();
                          document.execCommand('copy');
                          document.body.removeChild(textArea);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }
                      };
                      
                      return (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 mb-3 font-medium">Share on social media:</p>
                          <div className="flex flex-wrap gap-2">
                            {/* Facebook Share Button */}
                            <button
                              type="button"
                              onClick={shareToFacebook}
                              className="flex items-center gap-2 px-4 py-2 bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] transition-all text-sm font-medium shadow-sm"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                              </svg>
                              <span>Facebook</span>
                            </button>
                            
                            {/* Instagram Share Button */}
                            <button
                              type="button"
                              onClick={shareToInstagram}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#E4405F] to-[#FCAF45] text-white rounded-lg hover:opacity-90 transition-all text-sm font-medium shadow-sm"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                              </svg>
                              <span>Instagram</span>
                            </button>
                            
                            {/* Copy Share Link Button */}
                            <button
                              type="button"
                              onClick={copyShareLink}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium shadow-sm ${
                                copied 
                                  ? 'bg-green-500 text-white hover:bg-green-600' 
                                  : 'bg-gray-600 text-white hover:bg-gray-700'
                              }`}
                            >
                              {copied ? (
                                <>
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 6L9 17l-5-5"/>
                                  </svg>
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                  </svg>
                                  <span>Copy Link</span>
                                </>
                              )}
                            </button>
                          </div>
                      </div>
                      );
                    })()}
                    
                    <button
                      onClick={() => handlePublish('draft')}
                      disabled={publishing}
                      className="mt-4 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {publishing ? 'Unpublishing...' : 'Unpublish Website'}
                    </button>
                  </div>
                )}
                {(() => {
                  const isPublished = store.status && (store.status.toLowerCase() === 'published' || store.status === 'Published');
                  return !isPublished;
                })() && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-gray-700">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <span className="font-medium">Your website is not published</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Click the button below to make your website live and accessible to visitors.
                    </p>
                    <button
                      onClick={() => handlePublish('published')}
                      disabled={publishing}
                      className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {publishing ? 'Publishing...' : 'Publish Website'}
                    </button>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2 text-blue-900">
                  How to Publish & Share Your Store
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                  <li>Make sure you've saved all your content in the Site Builder</li>
                  <li>Review your store settings and information</li>
                  <li>Click "Publish Website" to make your site live</li>
                  <li>Copy and share your website URL with customers - it's free and works immediately!</li>
                </ol>
                <div className="mt-4 p-3 bg-white rounded border border-blue-200">
                  <p className="text-xs text-blue-900 font-semibold mb-1">💡 Want a Custom Domain?</p>
                  <p className="text-xs text-blue-700">
                    You can add your own custom domain (like mystore.com) to Vercel for free if you own a domain. 
                    See <code className="bg-blue-100 px-1 rounded">CUSTOM_DOMAIN_SETUP.md</code> in the project for instructions.
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
                <div className="flex space-x-4 flex-wrap gap-2">
                  <button
                    onClick={() => navigate('/site-builder')}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white"
                  >
                    Edit Content
                  </button>
                  
                  
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}

          {!store && error && (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => navigate('/store-templates')}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Create a Store
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublishPage;

