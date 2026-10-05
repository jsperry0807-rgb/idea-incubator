import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@config/routes';
import { ShortcutsHelpModal } from './ShortcutsHelpModal';

const EDITABLE_TAGS = ['INPUT', 'TEXTAREA', 'SELECT'];

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return EDITABLE_TAGS.includes(target.tagName);
}

/**
 * True while any dialog owns the screen.
 *
 * Covers native `<dialog open>` as well as the role-based dialogs `Modal` renders, so
 * the guard keeps working whichever kind a given overlay uses. Queryed per keystroke
 * rather than tracked in state, because dialogs are opened from all over the app and
 * a single source of truth in the DOM cannot fall out of sync with what is on screen.
 */
function hasOpenDialog(): boolean {
  return document.querySelector('[role="dialog"][aria-modal="true"], dialog[open]') !== null;
}

export function GlobalShortcuts() {
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;

      // Cmd/Ctrl + Enter submits the form that currently has focus. Checked before
      // the dialog guard below on purpose: inside a dialog this is the one shortcut
      // that should still fire, because it acts on the form in front of the user
      // instead of navigating away from it.
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        const form = target?.closest('form');
        if (form) {
          event.preventDefault();
          form.requestSubmit();
        }
        return;
      }

      if (isEditableTarget(event.target)) return;

      // An open dialog owns the keyboard. `n` navigated away mid-form and discarded
      // unsaved input, `/` pulled focus out of the dialog and behind it, and `?`
      // stacked a second z-50 modal on top of the first. Escape and the dialog's own
      // controls are unaffected, so nothing here traps the user.
      if (hasOpenDialog()) return;

      if (event.metaKey || event.ctrlKey || event.altKey) return;

      switch (event.key) {
        case '/': {
          const search = document.querySelector<HTMLElement>('[data-shortcut="search"]');
          if (search) {
            event.preventDefault();
            search.focus();
          }
          break;
        }
        case 'n':
          event.preventDefault();
          navigate(ROUTES.NEW_IDEA);
          break;
        case '?':
          // Set rather than toggle: with the guard above, `?` can only be reached
          // while no dialog is open, so it can only ever mean "open".
          event.preventDefault();
          setHelpOpen(true);
          break;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate]);

  return <ShortcutsHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />;
}
