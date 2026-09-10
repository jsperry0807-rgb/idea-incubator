import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Modal } from "@repo/ui";

import { InviteForm } from "./InviteForm";
import { ShareList } from "./ShareList";

export interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  ideaId: string;
  ideaTitle: string;
}

export function ShareModal({ open, onClose, ideaId, ideaTitle }: ShareModalProps) {
  const { t } = useTranslation();
  const [resetKey, setResetKey] = useState(0);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setResetKey((value) => value + 1);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("ideas.sharing.title")}
      footer={
        <Button variant="ghost" onClick={onClose}>
          {t("ideas.sharing.cancel")}
        </Button>
      }
    >
      <p className="mb-4 text-sm text-[var(--color-muted)]">
        {t("ideas.sharing.subtitle", { idea: ideaTitle })}
      </p>

      <div key={resetKey} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
            {t("ideas.sharing.inviteTitle")}
          </h3>
          <InviteForm ideaId={ideaId} />
        </div>

        <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
            {t("ideas.sharing.accessListTitle")}
          </h3>
          <ShareList ideaId={ideaId} />
        </div>
      </div>
    </Modal>
  );
}