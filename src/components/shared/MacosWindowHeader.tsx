import type { ReactNode } from 'react';

interface MacosWindowHeaderProps {
  title?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * Purely decorative macOS application-window header.
 * Features red / yellow / green traffic lights and clean window title.
 */
export function MacosWindowHeader({
  title,
  badge,
  actions,
  className = '',
}: MacosWindowHeaderProps) {
  return (
    <div
      className={`flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#DCE8E0] dark:border-[rgba(220,232,224,0.12)] bg-[#F8FCF9] dark:bg-[#111A15] select-none ${className}`}
    >
      {/* Decorative macOS Traffic Light Dots */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/50 inline-block shadow-sm" />
          <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50 inline-block shadow-sm" />
          <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/50 inline-block shadow-sm" />
        </div>

        {badge && <div className="ml-2">{badge}</div>}
      </div>

      {/* Centered Window Title */}
      {title && (
        <div className="text-xs font-medium text-surface-500 dark:text-surface-400 tracking-tight truncate max-w-[200px] sm:max-w-xs md:max-w-md">
          {title}
        </div>
      )}

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {actions}
      </div>
    </div>
  );
}
