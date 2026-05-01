import { useRef } from 'react';
import { CalendarDays } from 'lucide-react';

export function DateInput({ className = '', disabled = false, onChange, value, ...props }) {
  const inputRef = useRef(null);

  const openPicker = () => {
    const input = inputRef.current;
    if (!input || disabled) return;

    input.focus();

    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
        return;
      } catch {
        // Some browsers throw if showPicker is blocked; focus keeps manual entry available.
      }
    }
  };

  return (
    <div className="relative">
      <input
        {...props}
        ref={inputRef}
        type="date"
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`${className} pr-11`}
      />
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        aria-label="Buka date picker"
        className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-slate-400 transition-colors hover:text-slate-600 disabled:cursor-not-allowed disabled:text-slate-300"
      >
        <CalendarDays className="h-4 w-4" />
      </button>
    </div>
  );
}
