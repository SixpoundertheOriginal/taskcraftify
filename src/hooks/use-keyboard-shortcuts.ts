
import { useEffect, useCallback } from 'react';

type KeyboardShortcutOptions = {
  key: string;
  callback: () => void;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  preventDefault?: boolean;
  excludeInputs?: boolean;
};

export const useKeyboardShortcut = ({
  key,
  callback,
  ctrl = false,
  alt = false,
  shift = false,
  preventDefault = true,
  excludeInputs = true,
}: KeyboardShortcutOptions) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Check if we should ignore this event (when in input fields)
      if (
        excludeInputs &&
        (event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement ||
          (event.target as HTMLElement)?.isContentEditable)
      ) {
        return;
      }

      // Check if all required modifiers are pressed
      const ctrlPressed = ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const altPressed = alt ? event.altKey : !event.altKey;
      const shiftPressed = shift ? event.shiftKey : !event.shiftKey;
      
      // Check if the pressed key matches
      if (ctrlPressed && altPressed && shiftPressed && event.key.toLowerCase() === key.toLowerCase()) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback();
      }
    },
    [key, callback, ctrl, alt, shift, preventDefault, excludeInputs]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};
