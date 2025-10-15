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
  const [warnings, setWarnings] = useState([]);
  const [showWarnings, setShowWarnings] = useState(false);
  
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

  // Load user warnings
  const loadWarnings = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/user/warnings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const unreadWarnings = data.filter(w => !w.is_read);
        setWarnings(unreadWarnings);
        if (unreadWarnings.length > 0) {
          setShowWarnings(true);
        }
      }
    } catch (err) {
      console.error('Error loading warnings:', err);
    }
  };

  const markWarningRead = async (warningId) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      await fetch(`${API_URL}/user/warnings/${warningId}/mark-read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setWarnings(warnings.filter(w => w.id !== warningId));
      if (warnings.length <= 1) {
        setShowWarnings(false);
      }
    } catch (err) {
      console.error('Error marking warning as read:', err);
    }
  };

  useEffect(() => {
    loadUserUrls();
    loadWarnings();
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

  const shareToSocial = (platform, url) => {
    console.log('shareToSocial called with:', { platform, url });
    
    // Check if URL is provided
    if (!url) {
      alert('URL bulunamadı! / URL not found!');
      console.error('URL is undefined or null');
      return;
    }
    
    // Warn about localhost URLs for Facebook and LinkedIn
    if ((platform === 'facebook' || platform === 'linkedin') && url.includes('localhost')) {
      console.warn(`⚠️ ${platform.toUpperCase()} does not support localhost URLs. Please test with production URL (https://urlio.in)`);
      const shouldContinue = confirm(
        `⚠️ ${platform === 'facebook' ? 'Facebook' : 'LinkedIn'} localhost URL'lerini desteklemiyor.\n\n` +
        `Bu özelliği production'da (https://urlio.in) test etmelisiniz.\n\n` +
        `Yine de devam etmek istiyor musunuz?`
      );
      if (!shouldContinue) return;
    }
    
    // Create a more descriptive message
    const shareText = t('dashboard.share_message') || 'Check out this short link!';
    const text = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(url);
    
    console.log('Share text:', shareText);
    console.log('Encoded URL:', encodedUrl);
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${text}%20${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${text}`,
      email: `mailto:?subject=${text}&body=${text}%0A%0A${encodedUrl}`
    };
    
    const finalUrl = shareUrls[platform];
    console.log('Final share URL:', finalUrl);
    
    if (finalUrl) {
      window.open(finalUrl, '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Warnings Modal */}
      {showWarnings && warnings.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4 text-red-600">
              ⚠️ {t('i18n.language') === 'tr' ? 'Yönetici Uyarıları' : 'Admin Warnings'}
            </h3>
            <div className="space-y-4">
              {warnings.map((warning) => (
                <div key={warning.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <p className="text-gray-800 mb-2">{warning.message}</p>
                  {warning.url && (
                    <div className="mb-3 p-3 bg-white rounded border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">
                        {t('i18n.language') === 'tr' ? 'İlgili Link:' : 'Related Link:'}
                      </p>
                      <a 
                        href={warning.url.short_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {warning.url.short_url}
                      </a>
                      <p className="text-xs text-gray-500 mt-1">
                        {warning.url.original_url}
                      </p>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {new Date(warning.created_at).toLocaleString()}
                    </span>
                    <button
                      onClick={() => markWarningRead(warning.id)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      {t('i18n.language') === 'tr' ? 'Anladım' : 'Mark as Read'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowWarnings(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              {t('i18n.language') === 'tr' ? 'Kapat' : 'Close'}
            </button>
          </div>
        </div>
      )}
      
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
                        
                        {/* Social Share Buttons */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600 mb-2">{t('dashboard.share')}:</p>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => shareToSocial('twitter', url.short_url)}
                              className="p-2 bg-blue-400 hover:bg-blue-500 text-white rounded transition-colors"
                              title="Share on Twitter"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => shareToSocial('facebook', url.short_url)}
                              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                              title="Share on Facebook"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => shareToSocial('linkedin', url.short_url)}
                              className="p-2 bg-blue-700 hover:bg-blue-800 text-white rounded transition-colors"
                              title="Share on LinkedIn"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => shareToSocial('whatsapp', url.short_url)}
                              className="p-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                              title="Share on WhatsApp"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => shareToSocial('telegram', url.short_url)}
                              className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                              title="Share on Telegram"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => shareToSocial('email', url.short_url)}
                              className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                              title="Share via Email"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
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