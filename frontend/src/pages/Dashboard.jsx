import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { userAPI, publicAPI } from '../api';
import QRCode from 'react-qr-code';

const Dashboard = () => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUrls, setLoadingUrls] = useState(true);
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState('');
  
  const { t } = useTranslation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Load user's URLs when component mounts
  const loadUserUrls = async () => {
    try {
      setLoadingUrls(true);
      const response = await userAPI.getUserUrls();
      setUrls(response.data);
    } catch (err) {
      console.error('Error loading URLs:', err);
    } finally {
      setLoadingUrls(false);
    }
  };

  useEffect(() => {
    loadUserUrls();
  }, []);

  const handleShortenUrl = async (e) => {
    e.preventDefault();
    if (!originalUrl) return;

    setLoading(true);
    setMessage('');

    try {
      // Use public API if user is not logged in, otherwise use user API
      const token = localStorage.getItem('token');
      const response = token 
        ? await userAPI.shortenUrl(originalUrl)
        : await publicAPI.shortenUrl(originalUrl);
      const newUrl = response.data;
      
      setUrls(prev => [newUrl, ...prev]);
      setOriginalUrl('');
      
      if (typeof newUrl.message === 'object') {
        setMessage(newUrl.message[t('i18n.language')] || newUrl.message.tr);
      } else {
        setMessage(newUrl.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.detail?.message || err.message;
      if (typeof errorMessage === 'object') {
        setMessage(errorMessage[t('i18n.language')] || errorMessage.tr);
      } else {
        setMessage(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewStats = async (shortCode) => {
    try {
      const response = await userAPI.getStats(shortCode);
      setStats(response.data);
      setSelectedUrl(shortCode);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(t('common.copied'));
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadQRCode = (url, shortCode) => {
    // Create a canvas element to generate QR code
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 256;
    canvas.height = 256;
    
    // Create QR code using qrcode library
    import('qrcode').then(QRCode => {
      QRCode.toCanvas(canvas, url, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error) => {
        if (error) {
          console.error('QR Code generation error:', error);
          setMessage(t('common.qr_error'));
          return;
        }
        
        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `urlio-in-qr-${shortCode}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          
          setMessage(t('common.qr_downloaded'));
          setTimeout(() => setMessage(''), 2000);
        });
      });
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {t('dashboard.welcome')}
            </h1>
            <p className="text-xl text-gray-600">
              {t('dashboard.tagline')}
            </p>
          </div>

          {message && (
            <div className="mb-6 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
              {message}
            </div>
          )}

          {/* URL Shortening Form */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t('dashboard.shorten_url')}
            </h2>
            <form onSubmit={handleShortenUrl} className="flex gap-4">
              <input
                type="url"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                placeholder={t('dashboard.original_url')}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? t('common.loading') : t('dashboard.shorten_button')}
              </button>
            </form>
          </div>

          {/* URLs List */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t('dashboard.your_links')}
            </h2>
            
            {loadingUrls ? (
              <div className="text-center py-8">
                <p className="text-gray-500">{t('common.loading')}</p>
              </div>
            ) : urls.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No links created yet. Create your first short link above!
              </p>
            ) : (
              <div className="space-y-4">
                {urls.map((url, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-1">Original:</p>
                        <p className="text-blue-600 break-all mb-2">{url.original_url}</p>
                        
                        <p className="text-sm text-gray-600 mb-1">Short URL:</p>
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-green-600 font-mono">{url.short_url}</p>
                          <button
                            onClick={() => copyToClipboard(url.short_url)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            {t('common.copy')}
                          </button>
                        </div>
                        
                        <p className="text-sm text-gray-500">
                          {t('dashboard.clicks')}: {url.click_count || 0} | 
                          {t('dashboard.created')}: {new Date(url.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="ml-4 flex flex-col items-center gap-2">
                        <QRCode value={url.short_url} size={64} />
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleViewStats(url.short_code)}
                            className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                          >
                            {t('dashboard.analytics')}
                          </button>
                          <button
                            onClick={() => downloadQRCode(url.short_url, url.short_code)}
                            className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded"
                          >
                            {t('dashboard.download_qr')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats Modal */}
          {selectedUrl && stats && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">{t('dashboard.analytics')} - {selectedUrl}</h3>
                  <button
                    onClick={() => { setSelectedUrl(null); setStats(null); }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {t('common.close')}
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">{t('dashboard.country_stats')}</h4>
                    <div className="space-y-1">
                      {Object.entries(stats.country_stats || {}).map(([country, count]) => (
                        <div key={country} className="flex justify-between">
                          <span>{country}</span>
                          <span className="font-mono">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">{t('dashboard.recent_visits')}</h4>
                    <div className="space-y-1 text-sm">
                      {stats.recent_visits?.map((visit, index) => (
                        <div key={index} className="flex justify-between text-gray-600">
                          <span>{visit.country}</span>
                          <span>{new Date(visit.created_at).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;