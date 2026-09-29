import { useState, useCallback } from 'react';
import { Copy, Check, AlertCircle } from 'lucide-react';
import { copyToClipboard, htmlToPlainText } from '../../lib/clipboard';

interface CopyButtonProps {
  htmlContent: string;
  variant?: 'primary' | 'floating' | 'header';
}

export function CopyButton({ htmlContent, variant = 'primary' }: CopyButtonProps) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle');

  const handleCopy = useCallback(async () => {
    if (state === 'copied') return;

    try {
      const plainText = htmlToPlainText(htmlContent);
      const success = await copyToClipboard(htmlContent, plainText);

      if (success) {
        setState('copied');
        setTimeout(() => setState('idle'), 2500);
      } else {
        setState('error');
        setTimeout(() => setState('idle'), 3000);
      }
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  }, [htmlContent, state]);

  // Floating variant for long documents
  if (variant === 'floating') {
    return (
      <button
        onClick={handleCopy}
        disabled={state === 'copied'}
        className={`fixed bottom-6 right-6 z-30 p-3.5 rounded-full shadow-lg transition-all duration-200 cursor-pointer ${
          state === 'copied'
            ? 'bg-[#176B48] text-white shadow-[0_4px_16px_rgba(23,107,72,0.4)] scale-95'
            : state === 'error'
            ? 'bg-[#e5484d] text-white shadow-red-200 dark:shadow-red-900/30'
            : 'bg-[#22A06B] text-white shadow-[0_4px_16px_rgba(34,160,107,0.35)] hover:bg-[#176B48] hover:shadow-[0_6px_20px_rgba(34,160,107,0.45)] hover:scale-105 active:scale-95'
        }`}
        aria-label={
          state === 'copied'
            ? 'Copied'
            : state === 'error'
            ? 'Copy failed'
            : 'Copy All'
        }
        title={
          state === 'copied'
            ? 'Copied'
            : state === 'error'
            ? 'Unable to copy. Please try again.'
            : 'Copy All'
        }
      >
        {state === 'copied' ? (
          <Check size={20} className="animate-scale-in" />
        ) : state === 'error' ? (
          <AlertCircle size={20} />
        ) : (
          <Copy size={20} />
        )}
      </button>
    );
  }

  // Header mini variant
  if (variant === 'header') {
    return (
      <button
        onClick={handleCopy}
        disabled={state === 'copied'}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
          state === 'copied'
            ? 'bg-[#176B48] text-white'
            : state === 'error'
            ? 'bg-[#e5484d] text-white'
            : 'bg-[#22A06B] text-white hover:bg-[#176B48] shadow-sm'
        }`}
        aria-label="Copy All"
      >
        {state === 'copied' ? (
          <>
            <Check size={13} className="animate-scale-in" />
            <span>Copied</span>
          </>
        ) : (
          <>
            <Copy size={13} />
            <span>Copy All</span>
          </>
        )}
      </button>
    );
  }

  // Primary prominent pill button
  return (
    <button
      onClick={handleCopy}
      disabled={state === 'copied'}
      className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-200 cursor-pointer select-none ${
        state === 'copied'
          ? 'bg-[#176B48] text-white shadow-[0_2px_8px_rgba(23,107,72,0.3)] scale-[0.98]'
          : state === 'error'
          ? 'bg-[#e5484d] text-white shadow-[0_2px_8px_rgba(229,72,77,0.3)]'
          : 'bg-[#22A06B] text-white hover:bg-[#176B48] active:bg-[#14553A] shadow-[0_2px_10px_rgba(34,160,107,0.28)] hover:shadow-[0_4px_14px_rgba(34,160,107,0.38)]'
      }`}
      aria-label={
        state === 'copied'
          ? 'Copied'
          : state === 'error'
          ? 'Copy failed, try again'
          : 'Copy All'
      }
    >
      {state === 'copied' ? (
        <>
          <Check size={17} className="animate-scale-in" />
          <span>Copied</span>
        </>
      ) : state === 'error' ? (
        <>
          <AlertCircle size={17} />
          <span>Unable to copy</span>
        </>
      ) : (
        <>
          <Copy size={17} />
          <span>Copy All</span>
        </>
      )}
    </button>
  );
}
