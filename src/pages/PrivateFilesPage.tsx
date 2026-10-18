import { Link } from 'react-router-dom';
import { ArrowLeft, HardDrive } from 'lucide-react';
import { AdminNavbar } from '../components/admin/AdminNavbar';
import { PrivateFilesManager } from '../components/admin/PrivateFilesManager';

export function PrivateFilesPage() {
  return (
    <div className="min-h-screen bg-[#EEF6F1] dark:bg-[#0D1612]">
      {/* Admin Navbar */}
      <AdminNavbar />

      {/* Main content */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8">
        {/* Back navigation */}
        <Link
          to="/admin-panel/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 dark:text-surface-400 hover:text-[#22A06B] dark:hover:text-[#52C58F] transition-colors mb-6 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </Link>

        {/* Page heading */}
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2.5 mb-8">
          <HardDrive size={24} className="text-[#22A06B]" />
          Private Files
        </h1>

        {/* Existing PrivateFilesManager component — no changes */}
        <PrivateFilesManager />
      </main>
    </div>
  );
}
