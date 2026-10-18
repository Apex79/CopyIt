import { PrivateFilesManager } from '../components/admin/PrivateFilesManager';

export function PrivateFilesPage() {
  return (
    <div className="w-full">
      {/* Main content */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8">
        {/* Existing PrivateFilesManager component */}
        <PrivateFilesManager />
      </main>
    </div>
  );
}
