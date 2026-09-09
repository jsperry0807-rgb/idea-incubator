import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { PlanningSectionName } from "@repo/shared";
import { Button, Modal } from "@repo/ui";

const MAX_SIZE_BYTES = 500 * 1024;
const ACCEPTED_EXTENSIONS = [".md", ".markdown"];

export interface ImportMarkdownModalProps {
  open: boolean;
  onClose: () => void;
  section: PlanningSectionName;
  onImport: (content: string, filename: string) => Promise<void>;
}

export function ImportMarkdownModal({
  open,
  onClose,
  section,
  onImport,
}: ImportMarkdownModalProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setFile(null);
      setDragOver(false);
      setImporting(false);
      setError(null);
    }
  }

  function acceptFile(next: File | null | undefined) {
    if (!next) return;

    const name = next.name.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
      setFile(null);
      setError(t("ideas.planning.importInvalidType"));
      return;
    }
    if (next.size > MAX_SIZE_BYTES) {
      setFile(null);
      setError(t("ideas.planning.importTooLarge"));
      return;
    }

    setError(null);
    setFile(next);
  }

  async function handleImport() {
    if (!file) return;

    setImporting(true);
    setError(null);
    try {
      const content = await file.text();
      await onImport(content, file.name);
      onClose();
    } catch {
      setError(t("ideas.planning.importError"));
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("ideas.planning.importTitle")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={importing}>
            {t("ideas.planning.cancel")}
          </Button>
          <Button onClick={() => void handleImport()} disabled={!file || importing}>
            {importing ? t("ideas.planning.importing") : t("ideas.planning.import")}
          </Button>
        </>
      }
    >
      <p className="text-sm text-[var(--color-muted)]">
        {t("ideas.planning.importDescription", {
          section: t(`ideas.planning.sections.${section}`),
        })}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".md,.markdown"
        className="hidden"
        onChange={(event) => {
          acceptFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          acceptFile(event.dataTransfer.files?.[0]);
        }}
        className={[
          "flex w-full flex-col items-center gap-1 rounded-md border-2 border-dashed px-4 py-6 text-sm transition-colors duration-150",
          dragOver
            ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
            : "border-[var(--color-border)] hover:bg-[var(--color-muted)]/10",
        ].join(" ")}
      >
        <FileMarkdownIcon className="size-8 text-[var(--color-muted)]" />
        <span className="text-[var(--color-fg)]">
          {t("ideas.planning.dropzoneText")}
        </span>
        <span className="text-xs text-[var(--color-muted)]">
          {t("ideas.planning.dropzoneHint")}
        </span>
      </button>

      {file ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm">
          <span className="min-w-0 truncate font-mono text-[var(--color-fg)]">
            {file.name}
          </span>
          <span className="shrink-0 text-xs text-[var(--color-muted)]">
            {(file.size / 1024).toFixed(1)} KB
          </span>
          <button
            type="button"
            onClick={() => setFile(null)}
            className="shrink-0 text-[var(--color-muted)] transition-colors hover:text-[var(--color-danger)]"
            aria-label={t("ideas.planning.removeFile")}
          >
            ✕
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-[var(--color-danger)]">{error}</p>
      ) : null}
    </Modal>
  );
}

function FileMarkdownIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="m7 15 2.5 2.5L12 15" />
      <path d="m12 12 2.5 2.5L17 12" />
      <path d="M14.5 17.5V12" />
    </svg>
  );
}