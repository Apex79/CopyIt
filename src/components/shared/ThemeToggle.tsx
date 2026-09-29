import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import type { ThemeMode } from '../../types';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const modes: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
    { mode: 'light', icon: Sun, label: 'Light mode' },
    { mode: 'system', icon: Monitor, label: 'System theme' },
    { mode: 'dark', icon: Moon, label: 'Dark mode' },
  ];

  return (
    <div
      className="inline-flex items-center rounded-[var(--radius-macos-sm)] bg-surface-100 dark:bg-surface-800 p-0.5 gap-0.5"
      role="radiogroup"
      aria-label="Theme selection"
    >
      {modes.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => setTheme(mode)}
          className={`p-1.5 rounded-[8px] transition-all duration-200 cursor-pointer ${
            theme === mode
              ? 'bg-white dark:bg-surface-700 shadow-sm text-primary-600 dark:text-primary-400'
              : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-300'
          }`}
          role="radio"
          aria-checked={theme === mode}
          aria-label={label}
          title={label}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
}
