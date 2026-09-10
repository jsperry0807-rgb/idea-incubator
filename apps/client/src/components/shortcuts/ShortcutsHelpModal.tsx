import { useTranslation } from "react-i18next";
import { Button, Modal } from "@repo/ui";

interface ShortcutRow {
  labelKey: "search" | "create" | "save" | "close" | "help";
  keys: string[];
}

const SHORTCUTS: ShortcutRow[] = [
  { labelKey: "search", keys: ["/"] },
  { labelKey: "create", keys: ["n"] },
  { labelKey: "save", keys: ["⌘/Ctrl", "Enter"] },
  { labelKey: "close", keys: ["Esc"] },
  { labelKey: "help", keys: ["?"] },
];

export interface ShortcutsHelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsHelpModal({ open, onClose }: ShortcutsHelpModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("shortcuts.title")}
      footer={
        <Button variant="ghost" onClick={onClose}>
          {t("shortcuts.close")}
        </Button>
      }
    >
      <ul className="flex flex-col gap-2.5">
        {SHORTCUTS.map((shortcut) => (
          <li key={shortcut.labelKey} className="flex items-center justify-between gap-4">
            <span className="text-sm text-[var(--color-fg)]">
              {t(`shortcuts.${shortcut.labelKey}`)}
            </span>
            <span className="flex items-center gap-1">
              {shortcut.keys.map((key, index) => (
                <span key={key} className="flex items-center gap-1">
                  {index > 0 ? <span className="text-xs text-[var(--color-muted)]">+</span> : null}
                  <kbd className="rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/10 px-2 py-1 font-mono text-xs text-[var(--color-fg)]">
                    {key}
                  </kbd>
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}