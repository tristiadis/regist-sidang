'use client';

import { useEffect } from 'react';

type KeyboardShortcut = {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  callback: () => void;
  description?: string;
};

export function useKeyboardShortcut(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey;
        const shiftMatch = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey;
        const altMatch = shortcut.altKey === undefined || event.altKey === shortcut.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          // Don't trigger if user is typing in an input/textarea
          const target = event.target as HTMLElement;
          if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
          ) {
            // Allow Ctrl+K for search even in inputs
            if (!(shortcut.ctrlKey && shortcut.key === 'k')) {
              continue;
            }
          }

          event.preventDefault();
          shortcut.callback();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}

// Predefined shortcuts
export const SHORTCUTS = {
  SEARCH: { key: 'k', ctrlKey: true, description: 'Focus search (Ctrl+K)' },
  NEXT_PAGE: { key: 'ArrowRight', ctrlKey: true, description: 'Next page (Ctrl+→)' },
  PREV_PAGE: { key: 'ArrowLeft', ctrlKey: true, description: 'Previous page (Ctrl+←)' },
  REFRESH: { key: 'r', ctrlKey: true, description: 'Refresh data (Ctrl+R)' },
  ESCAPE: { key: 'Escape', description: 'Close modal (Esc)' },
};
