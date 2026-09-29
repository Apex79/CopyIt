import { Navigate } from 'react-router-dom';
import { AdminLogin as AdminLoginComponent } from '../components/admin/AdminLogin';
import { useAuth } from '../hooks/useAuth';

export function AdminLoginPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="w-8 h-8 border-2 border-primary-200 dark:border-primary-800 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/admin-panel/dashboard" replace />;
  }

  return <AdminLoginComponent />;
}
