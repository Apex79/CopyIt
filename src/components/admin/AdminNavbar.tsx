import { Link, useLocation } from 'react-router-dom';
import { FileText, ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ThemeToggle } from '../shared/ThemeToggle';
import { InstallButton } from '../shared/InstallButton';

export function AdminNavbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const isStorage = location.pathname.startsWith('/admin-panel/private-files');
  const isAdmin = !isStorage;

  return (
    <header className="macos-glass sticky top-0 z-40 border-b border-[#DCE8E0] dark:border-white/10">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Breadcrumb Navigation: CopyIt > Admin > Storage */}
          <nav aria-label="Admin navigation" className="flex items-center gap-2 sm:gap-3 flex-nowrap min-w-0">
            <Link to="/" className="flex items-center gap-2 group flex-shrink-0" title="CopyIt Home">
              <div className="w-7 h-7 rounded-lg bg-[#22A06B] flex items-center justify-center transition-transform group-hover:scale-105">
                <FileText size={15} className="text-white" />
              </div>
              <span className="font-semibold text-lg tracking-tight text-surface-900 dark:text-surface-100">
                CopyIt
              </span>
            </Link>

            <ChevronRight size={14} className="text-surface-400 flex-shrink-0" />

            <Link
              to="/admin-panel/dashboard"
              aria-current={isAdmin ? 'page' : undefined}
              className={`text-sm whitespace-nowrap transition-colors ${
                isAdmin
                  ? 'font-semibold text-surface-900 dark:text-surface-100'
                  : 'font-medium text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
              }`}
            >
              Admin
            </Link>

            <ChevronRight size={14} className="text-surface-400 flex-shrink-0" />

            <Link
              to="/admin-panel/private-files"
              aria-current={isStorage ? 'page' : undefined}
              className={`text-sm whitespace-nowrap transition-colors ${
                isStorage
                  ? 'font-semibold text-surface-900 dark:text-surface-100'
                  : 'font-medium text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
              }`}
            >
              Storage
            </Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <InstallButton />
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 dark:bg-surface-800/80 border border-[#DCE8E0] dark:border-surface-700 text-xs text-surface-600 dark:text-surface-300">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22A06B]" />
              {user?.email}
            </div>
            <button
              onClick={signOut}
              className="macos-btn-ghost text-sm gap-1.5"
              aria-label="Sign out"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
