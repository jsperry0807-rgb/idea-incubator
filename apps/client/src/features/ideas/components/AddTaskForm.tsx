import { useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button, Input, toast } from "@repo/ui";

import { useCreateTask } from "../hooks/useCreateTask";
import { useTasks } from "../hooks/useTasks";
import { MilestoneSelector } from "./MilestoneSelector";

export interface AddTaskFormProps {
  ideaId: string;
}

export function AddTaskForm({ ideaId }: AddTaskFormProps) {
  const { t } = useTranslation();
  const createTask = useCreateTask(ideaId);
  const tasksQuery = useTasks(ideaId);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [milestone, setMilestone] = useState("");

  const milestones = useMemo(
    () => [
      ...new Set(
        (tasksQuery.data ?? [])
          .map((task) => task.milestone)
          .filter((value): value is string => Boolean(value)),
      ),
    ],
    [tasksQuery.data],
  );

  function close() {
    setOpen(false);
    setTitle("");
    setMilestone("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      return;
    }
    try {
      await createTask.mutateAsync({
        title: title.trim(),
        ...(milestone.trim() ? { milestone: milestone.trim() } : {}),
      });
      close();
    } catch {
      toast.error(t("ideas.tasks.addError"));
    }
  }

  if (!open) {
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          {t("ideas.tasks.addTask")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t("ideas.tasks.taskPlaceholder")}
          aria-label={t("ideas.tasks.taskPlaceholder")}
          className="min-w-40 flex-1"
        />
        <MilestoneSelector
          value={milestone}
          onChange={setMilestone}
          milestones={milestones}
          placeholder={t("ideas.tasks.milestonePlaceholder")}
          aria-label={t("ideas.tasks.milestoneLabel")}
          className="w-44"
        />
        <Button
          type="submit"
          size="sm"
          variant="primary"
          disabled={createTask.isPending || !title.trim()}
        >
          {createTask.isPending ? t("ideas.tasks.addingTask") : t("ideas.tasks.add")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={close}
          disabled={createTask.isPending}
        >
          {t("ideas.tasks.cancel")}
        </Button>
      </div>
    </form>
  );
}