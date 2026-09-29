import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { ToastProvider } from './components/shared/Toast';
import { PublicHome } from './pages/PublicHome';

// Lazy-load admin routes for code splitting
const AdminLoginPage = lazy(() =>
  import('./pages/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage }))
);
const AdminLayout = lazy(() =>
  import('./pages/AdminLayout').then((m) => ({ default: m.AdminLayout }))
);
const AdminDashboardPage = lazy(() =>
  import('./pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);
const NewDocumentPage = lazy(() =>
  import('./pages/NewDocumentPage').then((m) => ({ default: m.NewDocumentPage }))
);
const EditDocumentPage = lazy(() =>
  import('./pages/EditDocumentPage').then((m) => ({ default: m.EditDocumentPage }))
);

function AdminFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary-200 dark:border-primary-800 border-t-primary-600 rounded-full animate-spin" />
        <span className="text-sm text-surface-500 dark:text-surface-400">Loading...</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<PublicHome />} />

              {/* Admin routes (lazy-loaded) */}
              <Route
                path="/admin-panel/login"
                element={
                  <Suspense fallback={<AdminFallback />}>
                    <AdminLoginPage />
                  </Suspense>
                }
              />

              <Route
                path="/admin-panel"
                element={
                  <Suspense fallback={<AdminFallback />}>
                    <AdminLayout />
                  </Suspense>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route
                  path="dashboard"
                  element={
                    <Suspense fallback={<AdminFallback />}>
                      <AdminDashboardPage />
                    </Suspense>
                  }
                />
                <Route
                  path="documents/new"
                  element={
                    <Suspense fallback={<AdminFallback />}>
                      <NewDocumentPage />
                    </Suspense>
                  }
                />
                <Route
                  path="documents/:id"
                  element={
                    <Suspense fallback={<AdminFallback />}>
                      <EditDocumentPage />
                    </Suspense>
                  }
                />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
