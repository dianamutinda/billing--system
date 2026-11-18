
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function Select({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  width = 'w-full',
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const selectRef = useRef(null);

  const selectedOption = options.find(
    (option) => option.value === value
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div ref={selectRef} className={`relative ${width}`}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center justify-between gap-3
          rounded-lg border border-[var(--border)]
          bg-[var(--bg-surface)] px-3 py-2.5 text-sm
          text-[var(--text-primary)] transition-colors
          hover:border-[var(--primary)]
          focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20
          disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <span className="truncate">
          {selectedOption?.label || placeholder}
        </span>

        <ChevronDown
          size={16}
          className={`shrink-0 text-[var(--text-secondary)] transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-2
            max-h-60 w-full overflow-y-auto rounded-xl
            border border-[var(--border)]
            bg-[var(--bg-surface)] p-1.5 shadow-lg"
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between
                  rounded-lg px-3 py-2.5 text-left text-sm
                  transition-colors ${
                    isSelected
                      ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-medium'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                  }`}
              >
                <span>{option.label}</span>

                {isSelected && <Check size={15} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
