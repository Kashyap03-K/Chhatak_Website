import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

export default function AdminRoute({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/orders/admin/stats')
      .then(() => setIsAdmin(true))
      .catch(() => setIsAdmin(false));
  }, [isAuthenticated]);

  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isAdmin === null) return null;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}
