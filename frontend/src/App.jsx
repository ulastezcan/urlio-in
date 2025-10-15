import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import './i18n';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const RedirectHandler = () => {
  const { shortCode } = useParams();
  
  useEffect(() => {
    // Redirect to backend URL
    window.location.href = `${API_URL}/${shortCode}`;
  }, [shortCode]);
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔗</div>
        <div style={{ fontSize: '18px', color: '#666' }}>Redirecting...</div>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return !token ? children : <Navigate to="/dashboard" />;
};

function App() {
  const { i18n } = useTranslation();

  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/:shortCode" 
            element={<RedirectHandler />} 
          />
          <Route 
            path="/" 
            element={<Navigate to="/dashboard" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;