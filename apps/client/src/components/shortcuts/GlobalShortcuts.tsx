import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "@config/routes";
import { ShortcutsHelpModal } from "./ShortcutsHelpModal";

const EDITABLE_TAGS = ["INPUT", "TEXTAREA", "SELECT"];

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return EDITABLE_TAGS.includes(target.tagName);
}

export function GlobalShortcuts() {
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;

      // Cmd/Ctrl + Enter → submit the form that currently has focus.
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        const form = target?.closest("form");
        if (form) {
          event.preventDefault();
          form.requestSubmit();
        }
        return;
      }

      if (isEditableTarget(event.target)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      switch (event.key) {
        case "/": {
          const search = document.querySelector<HTMLElement>(
            '[data-shortcut="search"]',
          );
          if (search) {
            event.preventDefault();
            search.focus();
          }
          break;
        }
        case "n":
          event.preventDefault();
          navigate(ROUTES.NEW_IDEA);
          break;
        case "?":
          event.preventDefault();
          setHelpOpen((value) => !value);
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  return <ShortcutsHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />;
}