import { Link } from 'react-router-dom';
import { FileText, Shield } from 'lucide-react';
import { ThemeToggle } from '../shared/ThemeToggle';
import { InstallButton } from '../shared/InstallButton';

export function Navbar() {
  return (
    <header className="macos-glass sticky top-0 z-40">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-surface-900 dark:text-surface-100 hover:opacity-90 transition-opacity"
          >
            <div className="w-7 h-7 rounded-lg bg-[#22A06B] flex items-center justify-center shadow-sm">
              <FileText size={15} className="text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight">CopyIt</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            <InstallButton />
            <ThemeToggle />
            <Link
              to="/admin-panel"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
              title="Admin Panel"
              aria-label="Admin Panel"
            >
              <Shield size={14} className="text-surface-400 group-hover:text-[#22A06B] transition-colors flex-shrink-0" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
