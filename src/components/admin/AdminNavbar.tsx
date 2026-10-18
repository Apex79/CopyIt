import { Link, useLocation } from 'react-router-dom';
import { FileText, ChevronRight, LogOut, LayoutDashboard, HardDrive } from 'lucide-react';
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
      {/* Top navigation row */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-14 gap-2">
          {/* Breadcrumb Navigation: CopyIt > Admin */}
          <nav aria-label="Admin breadcrumb" className="flex items-center gap-1.5 sm:gap-2 flex-nowrap min-w-0">
            <Link
              to="/"
              className="flex items-center gap-2 group flex-shrink-0"
              title="CopyIt Public Homepage"
              aria-label="CopyIt Homepage"
            >
              <div className="w-7 h-7 rounded-lg bg-[#22A06B] flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs">
                <FileText size={15} className="text-white" />
              </div>
              <span className="font-semibold text-base sm:text-lg tracking-tight text-surface-900 dark:text-surface-100 hidden sm:inline">
                CopyIt
              </span>
            </Link>

            <ChevronRight size={13} className="text-surface-400 flex-shrink-0" />

            <Link
              to="/admin-panel/dashboard"
              className="text-xs sm:text-sm font-semibold text-surface-800 dark:text-surface-200 hover:text-[#22A06B] dark:hover:text-[#52C58F] transition-colors whitespace-nowrap"
            >
              Admin Panel
            </Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            <InstallButton />
            <ThemeToggle />
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 dark:bg-surface-800/80 border border-[#DCE8E0] dark:border-surface-700 text-xs text-surface-600 dark:text-surface-300">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22A06B]" />
              {user?.email}
            </div>
            <button
              onClick={signOut}
              className="macos-btn-ghost text-xs sm:text-sm gap-1.5 px-2.5 py-1.5"
              aria-label="Sign out"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-navigation bar: two sections in a larger font like table rows */}
      <div className="border-t border-[#DCE8E0]/70 dark:border-white/5 bg-[#F4F9F6]/60 dark:bg-[#111C16]/60 backdrop-blur-xs">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-2.5 sm:py-3">
          <nav
            aria-label="Admin sections"
            className="inline-grid grid-cols-2 w-full sm:w-auto min-w-[280px] sm:min-w-[380px] border border-[#DCE8E0] dark:border-white/10 rounded-xl overflow-hidden bg-white/80 dark:bg-[#14201A]/90 shadow-2xs divide-x divide-[#DCE8E0] dark:divide-white/10"
          >
            <Link
              to="/admin-panel/dashboard"
              aria-current={isAdmin ? 'page' : undefined}
              className={`flex items-center justify-center gap-2.5 py-2 sm:py-2.5 px-4 sm:px-6 text-base sm:text-lg transition-all ${
                isAdmin
                  ? 'font-semibold text-[#14553A] dark:text-[#52C58F] bg-[#E1F3E9] dark:bg-[#176B48]/30 shadow-xs'
                  : 'font-medium text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <LayoutDashboard
                size={19}
                className={isAdmin ? 'text-[#22A06B] dark:text-[#52C58F]' : 'text-surface-400'}
              />
              <span>Admin</span>
            </Link>

            <Link
              to="/admin-panel/private-files"
              aria-current={isStorage ? 'page' : undefined}
              className={`flex items-center justify-center gap-2.5 py-2 sm:py-2.5 px-4 sm:px-6 text-base sm:text-lg transition-all ${
                isStorage
                  ? 'font-semibold text-[#14553A] dark:text-[#52C58F] bg-[#E1F3E9] dark:bg-[#176B48]/30 shadow-xs'
                  : 'font-medium text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <HardDrive
                size={19}
                className={isStorage ? 'text-[#22A06B] dark:text-[#52C58F]' : 'text-surface-400'}
              />
              <span>Storage</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
