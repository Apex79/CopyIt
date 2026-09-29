import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { ThemeToggle } from '../shared/ThemeToggle';

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
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
