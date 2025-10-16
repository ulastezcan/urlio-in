import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserUrls, setSelectedUserUrls] = useState([]);
  const [showUrlsModal, setShowUrlsModal] = useState(false);
  const [urlsLoading, setUrlsLoading] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [selectedUrlId, setSelectedUrlId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check if user is admin
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.is_admin) {
      setMessage(t('admin.messages.adminRequired'));
      setTimeout(() => navigate('/dashboard'), 2000);
      return;
    }
    loadDashboard();
  }, [navigate, t]);

  const loadDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data.data);
    } catch (error) {
      if (error.response?.status === 403) {
        setMessage(t('admin.messages.adminRequired'));
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUserUrls = async (userId, username) => {
    setUrlsLoading(true);
    setShowUrlsModal(true);
    setSelectedUser({ id: userId, username });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/users/${userId}/urls`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedUserUrls(response.data.urls || []);
    } catch (error) {
      console.error('Error loading user URLs:', error);
      setSelectedUserUrls([]);
    } finally {
      setUrlsLoading(false);
    }
  };

  const sendWarning = async (userId) => {
    if (!warningMessage.trim()) {
      alert(t('admin.warning.required'));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        user_id: userId,
        message: warningMessage
      };
      if (selectedUrlId) {
        payload.url_id = parseInt(selectedUrlId);
      }
      
      await axios.post(
        `${API_URL}/admin/users/${userId}/warn`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(t('admin.warning.success'));
      setWarningMessage('');
      setSelectedUrlId('');
      setSelectedUser(null);
      setSelectedUserUrls([]);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(t('admin.warning.error'));
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/admin/users/${userId}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(t('admin.users.statusUpdated'));
      loadDashboard();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(t('admin.users.statusError'));
    }
  };

  const changePassword = async () => {
    if (newPassword.length < 6) {
      alert(t('admin.password.minLength'));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/admin/change-password`,
        { new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(t('admin.password.success'));
      setNewPassword('');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(t('admin.password.error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{t('admin.messages.loading')}</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{t('admin.messages.accessDenied')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.title')}</h1>
          <p className="text-gray-600">{t('admin.subtitle')}</p>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
            {message}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600">
              {dashboardData.statistics.total_users}
            </div>
            <div className="text-gray-600">{t('admin.stats.users')}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600">
              {dashboardData.statistics.total_urls}
            </div>
            <div className="text-gray-600">{t('admin.stats.links')}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-purple-600">
              {dashboardData.statistics.total_clicks.toLocaleString()}
            </div>
            <div className="text-gray-600">{t('admin.stats.clicks')}</div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">{t('admin.password.title')}</h2>
          <div className="flex gap-4">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('admin.password.placeholder')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={changePassword}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {t('admin.password.button')}
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold">{t('admin.users.title')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.users.username')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.users.email')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.users.links')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.users.clicks')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.users.status')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.users.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.url_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.total_clicks.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {user.is_active ? t('admin.users.active') : t('admin.users.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => loadUserUrls(user.id, user.username)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        📋 {t('admin.users.viewLinks')}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          loadUserUrls(user.id, user.username);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        ⚠️ {t('admin.users.sendWarning')}
                      </button>
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className="text-orange-600 hover:text-orange-900"
                      >
                        {user.is_active ? '🔒 ' + t('admin.users.deactivate') : '✅ ' + t('admin.users.activate')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Warning Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">
                {t('admin.warning.title')} {selectedUser.username}
              </h3>
              
              {/* URL Selection */}
              {selectedUserUrls.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.warning.selectUrl')}
                  </label>
                  <select
                    value={selectedUrlId}
                    onChange={(e) => setSelectedUrlId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">{t('admin.warning.selectUrlPlaceholder')}</option>
                    {selectedUserUrls.map((url) => (
                      <option key={url.id} value={url.id}>
                        {url.short_code} - {url.original_url.substring(0, 50)}...
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <textarea
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                placeholder={t('admin.warning.message')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4"
                rows="4"
              />
              <div className="flex gap-4">
                <button
                  onClick={() => sendWarning(selectedUser.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  {t('admin.warning.send')}
                </button>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setSelectedUserUrls([]);
                    setWarningMessage('');
                    setSelectedUrlId('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  {t('admin.warning.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User URLs Modal */}
        {showUrlsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  {t('admin.urls.title')}: {selectedUser?.username}
                </h3>
                <button
                  onClick={() => {
                    setShowUrlsModal(false);
                    setSelectedUserUrls([]);
                    if (!selectedUser) setSelectedUser(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              {urlsLoading ? (
                <div className="text-center py-8">
                  <div className="text-gray-600">{t('common.loading')}</div>
                </div>
              ) : selectedUserUrls.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {t('admin.urls.noUrls')}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {t('admin.urls.shortCode')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {t('admin.urls.originalUrl')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {t('admin.urls.clicks')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {t('admin.urls.created')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {t('admin.urls.status')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedUserUrls.map((url) => (
                        <tr key={url.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <a 
                              href={`https://urlio.in/${url.short_code}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900"
                            >
                              {url.short_code}
                            </a>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                            <a 
                              href={url.original_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-blue-600"
                              title={url.original_url}
                            >
                              {url.original_url}
                            </a>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {url.click_count.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {new Date(url.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {url.is_flagged ? (
                              <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">
                                🚩 {t('admin.urls.flagged')}
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                                ✓ {t('admin.urls.active')}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 text-sm text-gray-600">
                    {t('admin.urls.total')}: {selectedUserUrls.length}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
