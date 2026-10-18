import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useOutlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AdminNavbar } from '../components/admin/AdminNavbar';

interface ViewSnapshot {
  key: string;
  node: React.ReactNode;
}

function getRouteRank(pathname: string): number {
  if (pathname.includes('/admin-panel/private-files')) return 1;
  if (pathname.includes('/admin-panel/dashboard') || pathname === '/admin-panel') return 0;
  return -1;
}

export function AdminLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const outlet = useOutlet();

  const [prevView, setPrevView] = useState<ViewSnapshot | null>(null);
  const [direction, setDirection] = useState<'forward' | 'backward' | null>(null);

  const prevPathRef = useRef(location.pathname);
  const prevOutletRef = useRef(outlet);

  // Preload admin pages to eliminate Suspense white flashes during horizontal transitions
  useEffect(() => {
    import('./AdminDashboardPage');
    import('./PrivateFilesPage');
  }, []);

  useEffect(() => {
    const prevPath = prevPathRef.current;
    const nextPath = location.pathname;

    if (prevPath !== nextPath) {
      const prevRank = getRouteRank(prevPath);
      const nextRank = getRouteRank(nextPath);

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Animate horizontally between Dashboard and Private Files
      if (!prefersReducedMotion && prevRank !== -1 && nextRank !== -1 && prevRank !== nextRank) {
        const dir = nextRank > prevRank ? 'forward' : 'backward';
        setPrevView({
          key: prevPath,
          node: prevOutletRef.current,
        });
        setDirection(dir);
        window.scrollTo(0, 0);

        const timer = setTimeout(() => {
          setPrevView(null);
          setDirection(null);
        }, 260);

        prevPathRef.current = nextPath;
        prevOutletRef.current = outlet;
        return () => clearTimeout(timer);
      } else {
        setPrevView(null);
        setDirection(null);
        prevPathRef.current = nextPath;
        prevOutletRef.current = outlet;
        window.scrollTo(0, 0);
      }
    } else {
      prevOutletRef.current = outlet;
    }
  }, [location.pathname, outlet]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-200 dark:border-primary-800 border-t-primary-600 rounded-full animate-spin" />
          <span className="text-sm text-surface-500 dark:text-surface-400">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin-panel/login" replace />;
  }

  const isMainAdminSection =
    location.pathname === '/admin-panel/dashboard' ||
    location.pathname === '/admin-panel/private-files' ||
    location.pathname === '/admin-panel';

  return (
    <div className="min-h-screen bg-[#EEF6F1] dark:bg-[#0D1612] flex flex-col">
      {/* Top navigation remains stationary and never flickers/slides */}
      {isMainAdminSection && <AdminNavbar />}

      {/* Content area with horizontal slide transition */}
      <div className="flex-1 relative overflow-x-clip">
        {prevView && direction && (
          <div
            key={`prev-${prevView.key}`}
            className={`absolute top-0 left-0 w-full ${
              direction === 'forward' ? 'admin-slide-out-left' : 'admin-slide-out-right'
            }`}
            aria-hidden="true"
          >
            {prevView.node}
          </div>
        )}

        <div
          key={`current-${location.pathname}`}
          className={`relative w-full ${
            direction === 'forward'
              ? 'admin-slide-in-right'
              : direction === 'backward'
              ? 'admin-slide-in-left'
              : ''
          }`}
        >
          {outlet}
        </div>
      </div>
    </div>
  );
}
