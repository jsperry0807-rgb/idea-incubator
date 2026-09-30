import { useTranslation } from "react-i18next";
import {
  IDEA_PROJECT_TYPE_VALUES,
  type Idea,
  type IdeaProjectType,
} from "@repo/shared";
import { toast } from "@repo/ui";

import { useUpdateIdea } from "../hooks/useUpdateIdea";

export interface ProjectTypeSelectProps {
  idea: Idea;
}

export function ProjectTypeSelect({ idea }: ProjectTypeSelectProps) {
  const { t } = useTranslation();
  const updateMutation = useUpdateIdea();

  const handleChange = (projectType: IdeaProjectType) => {
    if (projectType === idea.projectType) {
      return;
    }
    try {
      void updateMutation.mutateAsync(
        { id: idea.id, input: { projectType } },
        {
          onSuccess: () => toast.success(t("ideas.detail.projectTypeUpdated")),
          onError: () => toast.error(t("ideas.detail.projectTypeUpdateError")),
        },
      );
    } catch {
      toast.error(t("ideas.detail.projectTypeUpdateError"));
    }
  };

  return (
    <select
      value={idea.projectType}
      onChange={(event) => handleChange(event.target.value as IdeaProjectType)}
      disabled={updateMutation.isPending}
      aria-label={t("ideas.detail.projectType")}
      className={[
        "rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 text-sm text-[var(--color-fg)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]",
        "disabled:pointer-events-none disabled:opacity-50",
      ].join(" ")}
    >
      {IDEA_PROJECT_TYPE_VALUES.map((projectType) => (
        <option key={projectType} value={projectType}>
          {t(`ideas.projectType.${projectType}`)}
        </option>
      ))}
    </select>
  );
}