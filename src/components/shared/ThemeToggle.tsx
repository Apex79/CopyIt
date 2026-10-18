import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import type { ThemeMode } from '../../types';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const modes: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
    { mode: 'light', icon: Sun, label: 'Light mode' },
    { mode: 'system', icon: Monitor, label: 'System mode' },
    { mode: 'dark', icon: Moon, label: 'Dark mode' },
  ];

  return (
    <div
      className="inline-flex items-center p-0.5 rounded-full bg-white/80 dark:bg-[#15221B]/90 border border-[#DCE8E0] dark:border-white/10 shadow-2xs backdrop-blur-xs"
      role="radiogroup"
      aria-label="Theme selection"
    >
      {modes.map(({ mode, icon: Icon, label }) => {
        const isSelected = theme === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => setTheme(mode)}
            className={`w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22A06B] focus-visible:ring-offset-1 dark:focus-visible:ring-offset-surface-900 ${
              isSelected
                ? 'bg-[#E1F3E9] dark:bg-[#176B48]/35 text-[#14553A] dark:text-[#52C58F] border border-[#22A06B]/30 shadow-xs'
                : 'text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
            }`}
            role="radio"
            aria-checked={isSelected}
            aria-label={label}
            title={label}
          >
            <Icon size={14} className={isSelected ? 'stroke-[2.2]' : 'stroke-[1.8]'} />
          </button>
        );
      })}
    </div>
  );
}
