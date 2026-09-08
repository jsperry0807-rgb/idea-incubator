import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button, Input, toast } from "@repo/ui";

import { useCreateTask } from "../hooks/useCreateTask";

export interface AddTaskFormProps {
  ideaId: string;
}

export function AddTaskForm({ ideaId }: AddTaskFormProps) {
  const { t } = useTranslation();
  const createTask = useCreateTask(ideaId);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  function close() {
    setOpen(false);
    setTitle("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      return;
    }
    try {
      await createTask.mutateAsync({ title: title.trim() });
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
    <form onSubmit={(event) => void handleSubmit(event)} className="flex items-center gap-2">
      <Input
        autoFocus
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder={t("ideas.tasks.taskPlaceholder")}
        aria-label={t("ideas.tasks.addTask")}
        className="flex-1"
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
    </form>
  );
}