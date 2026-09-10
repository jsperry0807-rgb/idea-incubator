import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button, Input, toast } from "@repo/ui";
import { ShareRole } from "@repo/shared";

import { useShareMutations } from "../../hooks/useShareMutations";
import { AccessRoleSelect } from "./AccessRoleSelect";

export interface InviteFormProps {
  ideaId: string;
}

function getStatus(error: unknown): number | undefined {
  return (error as { response?: { status?: number } }).response?.status;
}

export function InviteForm({ ideaId }: InviteFormProps) {
  const { t } = useTranslation();
  const { invite } = useShareMutations(ideaId);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ShareRole>(ShareRole.VIEW);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;

    try {
      await invite.mutateAsync({ email: email.trim(), role });
      toast.success(t("ideas.sharing.inviteSuccess", { email: email.trim() }));
      setEmail("");
      setRole(ShareRole.VIEW);
    } catch (error) {
      const status = getStatus(error);
      if (status === 409) {
        toast.error(t("ideas.sharing.inviteConflict"));
      } else if (status === 404) {
        toast.error(t("ideas.sharing.inviteNotFound"));
      } else {
        toast.error(t("ideas.sharing.inviteError"));
      }
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("ideas.sharing.emailPlaceholder")}
          aria-label={t("ideas.sharing.emailLabel")}
          className="min-w-44 flex-1"
        />
        <AccessRoleSelect
          value={role}
          onChange={setRole}
          disabled={invite.isPending}
          ariaLabel={t("ideas.sharing.roleLabel")}
        />
        <Button
          type="submit"
          size="sm"
          variant="primary"
          disabled={invite.isPending || !email.trim()}
        >
          {invite.isPending ? t("ideas.sharing.inviting") : t("ideas.sharing.invite")}
        </Button>
      </div>
    </form>
  );
}