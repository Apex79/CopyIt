import { useState, useEffect, useMemo } from 'react';
import {
  HardDrive, Image, FileText, Code,
  Archive, File as FileIcon,
} from 'lucide-react';
import type { PrivateFile } from '../../types';
import { supabase } from '../../lib/supabase';

interface StorageInsightProps {
  files: PrivateFile[];
  loading?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

interface CategoryStat {
  id: string;
  label: string;
  icon: typeof FileIcon;
  color: string;
  bgColor: string;
  bytes: number;
  count: number;
  percentage: number;
}

export function StorageInsight({ files, loading }: StorageInsightProps) {
  const [bucketObjectBytes, setBucketObjectBytes] = useState<number | null>(null);

  // Fetch actual sum of stored object sizes from Supabase Storage metadata (storage.objects)
  useEffect(() => {
    let isMounted = true;
    async function fetchBucketUsage() {
      try {
        const [rootRes, privateRes] = await Promise.all([
          supabase.storage.from('private-files').list('', { limit: 1000 }),
          supabase.storage.from('private-files').list('private', { limit: 1000 }),
        ]);

        const allItems = [
          ...(rootRes.data || []),
          ...(privateRes.data || []),
        ];

        if (allItems.length > 0 && isMounted) {
          const total = allItems.reduce((sum, item) => {
            const size = item.metadata?.size || 0;
            return sum + size;
          }, 0);
          if (total > 0) {
            setBucketObjectBytes(total);
          }
        }
      } catch (err) {
        console.warn('[StorageInsight] Could not retrieve bucket storage objects list:', err);
      }
    }
    fetchBucketUsage();
    return () => {
      isMounted = false;
    };
  }, [files]);

  const stats = useMemo(() => {
    let totalTableBytes = 0;
    const categories: Record<string, { bytes: number; count: number }> = {
      images: { bytes: 0, count: 0 },
      documents: { bytes: 0, count: 0 },
      code: { bytes: 0, count: 0 },
      archives: { bytes: 0, count: 0 },
      other: { bytes: 0, count: 0 },
    };

    const largestFile = files.reduce<PrivateFile | null>((max, file) => {
      const currentSize = file.file_size || 0;
      const maxSize = max?.file_size || 0;
      return currentSize > maxSize ? file : max;
    }, null);

    files.forEach((file) => {
      const size = file.file_size || 0;
      totalTableBytes += size;

      const mime = (file.mime_type || '').toLowerCase();
      const ext = (file.file_name.split('.').pop() || '').toLowerCase();

      if (mime.startsWith('image/')) {
        categories.images.bytes += size;
        categories.images.count += 1;
      } else if (
        mime.includes('pdf') ||
        mime.includes('document') ||
        mime.includes('msword') ||
        mime.includes('sheet') ||
        ['pdf', 'docx', 'doc', 'txt', 'rtf', 'odt', 'csv', 'xlsx'].includes(ext)
      ) {
        categories.documents.bytes += size;
        categories.documents.count += 1;
      } else if (
        mime.includes('javascript') ||
        mime.includes('typescript') ||
        mime.includes('json') ||
        mime.includes('xml') ||
        ['js', 'ts', 'jsx', 'tsx', 'py', 'json', 'html', 'css', 'yaml', 'yml', 'sh', 'sql', 'md'].includes(ext)
      ) {
        categories.code.bytes += size;
        categories.code.count += 1;
      } else if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) {
        categories.archives.bytes += size;
        categories.archives.count += 1;
      } else {
        categories.other.bytes += size;
        categories.other.count += 1;
      }
    });

    // Use actual bucket object bytes from Supabase Storage metadata when available; fallback to table sum
    const totalBytes = bucketObjectBytes !== null ? bucketObjectBytes : totalTableBytes;

    const categoryList: CategoryStat[] = [
      {
        id: 'images',
        label: 'Images',
        icon: Image,
        color: 'bg-[#22A06B]',
        bgColor: 'text-[#22A06B]',
        bytes: categories.images.bytes,
        count: categories.images.count,
        percentage: totalTableBytes > 0 ? (categories.images.bytes / totalTableBytes) * 100 : 0,
      },
      {
        id: 'documents',
        label: 'Documents',
        icon: FileText,
        color: 'bg-[#0D9488]',
        bgColor: 'text-[#0D9488]',
        bytes: categories.documents.bytes,
        count: categories.documents.count,
        percentage: totalTableBytes > 0 ? (categories.documents.bytes / totalTableBytes) * 100 : 0,
      },
      {
        id: 'code',
        label: 'Code & Data',
        icon: Code,
        color: 'bg-[#6366F1]',
        bgColor: 'text-[#6366F1]',
        bytes: categories.code.bytes,
        count: categories.code.count,
        percentage: totalTableBytes > 0 ? (categories.code.bytes / totalTableBytes) * 100 : 0,
      },
      {
        id: 'archives',
        label: 'Archives',
        icon: Archive,
        color: 'bg-[#F59E0B]',
        bgColor: 'text-[#F59E0B]',
        bytes: categories.archives.bytes,
        count: categories.archives.count,
        percentage: totalTableBytes > 0 ? (categories.archives.bytes / totalTableBytes) * 100 : 0,
      },
      {
        id: 'other',
        label: 'Other',
        icon: FileIcon,
        color: 'bg-[#64748B]',
        bgColor: 'text-[#64748B]',
        bytes: categories.other.bytes,
        count: categories.other.count,
        percentage: totalTableBytes > 0 ? (categories.other.bytes / totalTableBytes) * 100 : 0,
      },
    ].filter((cat) => cat.count > 0);

    return {
      totalBytes,
      totalCount: files.length,
      categoryList,
      largestFile,
    };
  }, [bucketObjectBytes, files]);

  if (loading) {
    return null;
  }

  return (
    <div className="macos-card p-4 sm:p-5 border border-[#DCE8E0] dark:border-[rgba(220,232,224,0.12)] bg-white/95 dark:bg-[#131E18]/95 space-y-3">
      {/* Top Header: Title & Total metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E1F3E9] dark:bg-[#176B48]/20 flex items-center justify-center text-[#22A06B] dark:text-[#52C58F] shadow-xs flex-shrink-0">
            <HardDrive size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 leading-none">
              Vault Storage Insights
            </h3>
            <p className="text-[11px] text-surface-500 dark:text-surface-400 mt-1">
              Private Files Storage Used
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-sm font-bold text-surface-900 dark:text-surface-100 font-mono tracking-tight">
            {formatFileSize(stats.totalBytes)} used
          </span>
          <span className="text-surface-400 dark:text-surface-500 mx-1.5">·</span>
          <span className="text-xs text-surface-600 dark:text-surface-300 font-medium">
            {stats.totalCount} {stats.totalCount === 1 ? 'file' : 'files'}
          </span>
        </div>
      </div>

      {/* Actual Usage Progress Bar */}
      <div className="space-y-1.5">
        <div className="h-2.5 w-full bg-surface-100 dark:bg-surface-800/80 rounded-full overflow-hidden flex">
          {stats.totalBytes > 0 && stats.categoryList.length > 0 ? (
            stats.categoryList.map((cat) => (
              <div
                key={cat.id}
                style={{ width: `${Math.max(cat.percentage, 2)}%` }}
                className={`h-full ${cat.color} transition-all duration-500 first:rounded-l-full last:rounded-r-full`}
                title={`${cat.label}: ${formatFileSize(cat.bytes)} (${cat.percentage.toFixed(1)}%)`}
              />
            ))
          ) : (
            <div className="h-full w-full bg-surface-200/50 dark:bg-surface-800/50 rounded-full" />
          )}
        </div>

        {/* Labels under the progress bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-surface-500 dark:text-surface-400">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-surface-700 dark:text-surface-300">Private Files storage</span>
            <span className="text-surface-300 dark:text-surface-600">•</span>
            <span className="text-surface-400 dark:text-surface-500">50 MB max per file</span>
          </div>
          <div className="truncate">
            {stats.largestFile ? (
              <span>
                Largest: <strong className="font-medium text-surface-700 dark:text-surface-300">{stats.largestFile.file_name}</strong> ({formatFileSize(stats.largestFile.file_size)})
              </span>
            ) : (
              <span>No files stored</span>
            )}
          </div>
        </div>
      </div>

      {/* Category breakdown chips */}
      {stats.categoryList.length > 0 && (
        <div className="pt-2 border-t border-surface-100 dark:border-surface-800/60 flex flex-wrap items-center gap-2 sm:gap-2.5">
          {stats.categoryList.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-surface-200/70 dark:border-surface-700/50 text-xs"
              >
                <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                <Icon size={12} className={cat.bgColor} />
                <span className="font-medium text-surface-700 dark:text-surface-300">
                  {cat.label}
                </span>
                <span className="text-surface-400 dark:text-surface-500 font-mono text-[11px]">
                  ({cat.count})
                </span>
                <span className="font-mono text-[11px] text-surface-600 dark:text-surface-400 font-medium">
                  {formatFileSize(cat.bytes)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
