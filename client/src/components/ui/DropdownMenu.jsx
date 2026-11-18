
import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

export default function DropdownMenu({
  items = [],
  trigger,
  align = 'right',
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
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

  function handleItemClick(item) {
    if (item.disabled || item.divider) return;

    item.onClick?.();
    setOpen(false);
  }

  return (
    <div ref={menuRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg
          text-[var(--text-secondary)] transition-colors
          hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]
          focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
      >
        {trigger || <MoreHorizontal size={19} />}
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute top-full z-50 mt-2 min-w-[190px]
            overflow-hidden rounded-xl border border-[var(--border)]
            bg-[var(--bg-surface)] py-1.5 shadow-lg
            ${align === 'left' ? 'left-0' : 'right-0'}`}
        >
          {items.map((item, index) => {
            if (item.divider) {
              return (
                <div
                  key={`divider-${index}`}
                  className="my-1 border-t border-[var(--border)]"
                />
              );
            }

            const Icon = item.icon;

            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => handleItemClick(item)}
                className={`flex w-full items-center gap-3 px-3.5 py-2.5
                  text-left text-sm transition-colors
                  disabled:cursor-not-allowed disabled:opacity-40
                  ${
                    item.danger
                      ? 'text-[var(--danger)] hover:bg-[var(--bg-muted)]'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                  }`}
              >
                {Icon && <Icon size={16} />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
