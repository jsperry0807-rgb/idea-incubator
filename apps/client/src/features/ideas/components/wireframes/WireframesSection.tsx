import { useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal, Spinner, toast } from '@repo/ui';

import {
  useDeleteWireframe,
  useUploadWireframe,
  useWireframe,
  useWireframes,
} from '@features/ideas/hooks/useWireframes';

function sanitizeWireframeName(filename: string): string | null {
  const base = filename.replace(/\.[^./]+$/, '').toLowerCase();
  const slug = base
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/, '');
  return slug.length > 0 ? slug : null;
}

function isHtmlFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return lower.endsWith('.html') || lower.endsWith('.htm');
}

export function WireframesSection({ ideaId }: { ideaId: string }) {
  const { t } = useTranslation();
  const filesQuery = useWireframes(ideaId);
  const uploadMutation = useUploadWireframe(ideaId);
  const deleteMutation = useDeleteWireframe(ideaId);

  const [viewing, setViewing] = useState<string | null>(null);
  const [isUploadingFolder, setIsUploadingFolder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const wireframeQuery = useWireframe(ideaId, viewing ? viewing.replace(/\.html$/, '') : null);

  const files = filesQuery.data ?? [];

  async function uploadFile(file: File): Promise<boolean> {
    const name = sanitizeWireframeName(file.name);
    if (!name) {
      toast.error(t('ideas.wireframes.invalidName'));
      return false;
    }
    try {
      const html = await file.text();
      await uploadMutation.mutateAsync({ name, html });
      return true;
    } catch (error) {
      const status = (error as { response?: { status?: number } } | undefined)?.response?.status;
      if (status === 409) {
        toast.error(t('ideas.wireframes.alreadyExists'));
      } else if (status === 413 || status === 422) {
        toast.error(t('ideas.wireframes.tooLarge'));
      } else {
        toast.error(t('ideas.wireframes.uploadError'));
      }
      return false;
    }
  }

  async function handleFileChosen(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!isHtmlFile(file)) {
      toast.error(t('ideas.wireframes.invalidType'));
      return;
    }

    const success = await uploadFile(file);
    if (success) {
      toast.success(t('ideas.wireframes.uploaded'));
    }
  }

  async function handleFolderChosen(event: ChangeEvent<HTMLInputElement>) {
    const fileList = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (fileList.length === 0) return;

    const htmlFiles = fileList.filter(isHtmlFile);
    if (htmlFiles.length === 0) {
      toast.error(t('ideas.wireframes.folderNoHtml'));
      return;
    }

    setIsUploadingFolder(true);
    let uploaded = 0;
    for (const file of htmlFiles) {
      const relPath =
        'webkitRelativePath' in file && file.webkitRelativePath
          ? file.webkitRelativePath
          : file.name;
      const name = sanitizeWireframeName(relPath);
      if (!name) continue;
      try {
        const html = await file.text();
        await uploadMutation.mutateAsync({ name, html });
        uploaded += 1;
      } catch {
        // individual file failures are reported by the upload mutation;
        // keep going with the rest of the folder.
      }
    }
    setIsUploadingFolder(false);

    if (uploaded > 0) {
      toast.success(
        uploaded === htmlFiles.length
          ? t('ideas.wireframes.folderUploaded', { count: uploaded })
          : t('ideas.wireframes.folderPartial', {
              uploaded,
              total: htmlFiles.length,
            })
      );
    } else {
      toast.error(t('ideas.wireframes.folderFailed'));
    }
  }

  async function handleDelete() {
    if (!viewing) return;
    try {
      await deleteMutation.mutateAsync(viewing.replace(/\.html$/, ''));
      setViewing(null);
      toast.success(t('ideas.wireframes.deleted'));
    } catch {
      toast.error(t('ideas.wireframes.deleteError'));
    }
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="idea-wireframes-heading">
      <div className="flex items-center justify-between gap-2">
        <h2 id="idea-wireframes-heading" className="text-sm font-medium">
          {t('ideas.wireframes.title')}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            isLoading={isUploadingFolder}
            onClick={() => folderInputRef.current?.click()}
          >
            {t('ideas.wireframes.uploadFolder')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            isLoading={uploadMutation.isPending && !isUploadingFolder}
            onClick={() => fileInputRef.current?.click()}
          >
            {t('ideas.wireframes.upload')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm"
            className="sr-only"
            onChange={(e) => void handleFileChosen(e)}
          />
          <input
            ref={folderInputRef}
            type="file"
            accept=".html,.htm"
            multiple
            {...{ webkitdirectory: '' }}
            className="sr-only"
            onChange={(e) => void handleFolderChosen(e)}
          />
        </div>
      </div>

      {filesQuery.isLoading ? (
        <div className="flex justify-center py-4">
          <Spinner label={t('app.loading')} />
        </div>
      ) : files.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">{t('ideas.wireframes.empty')}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {files.map((filename) => (
            <button
              key={filename}
              type="button"
              onClick={() => setViewing(filename)}
              className="cursor-pointer rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-muted)] transition-colors hover:bg-[var(--color-muted)]/10 hover:text-[var(--color-fg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            >
              {filename}
            </button>
          ))}
        </div>
      )}

      <Modal
        title={viewing ?? ''}
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        closeLabel={t('app.close')}
      >
        <div className="flex flex-col gap-3">
          <iframe
            title={viewing ?? ''}
            sandbox="allow-scripts"
            srcDoc={wireframeQuery.data?.html ?? ''}
            className="h-[60vh] w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-white"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={deleteMutation.isPending}
              onClick={() => void handleDelete()}
            >
              {t('ideas.wireframes.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
