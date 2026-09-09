import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  IDEA_STATUS_VALUES,
  type IdeaPipeline,
  type IdeaPriority,
  type IdeaStatus,
  type PipelineIdea,
} from "@repo/shared";
import { Spinner, toast } from "@repo/ui";

import { useTags } from "@features/tags/hooks/useTags";
import { usePipeline } from "../hooks/usePipeline";
import { useUpdateIdeaStatus } from "../hooks/useUpdateIdeaStatus";
import { DragOverlay } from "./DragOverlay";
import { KanbanColumn } from "./KanbanColumn";
import { PipelineFilterBar } from "./PipelineFilterBar";

export function KanbanBoard() {
  const { t } = useTranslation();
  const query = usePipeline();
  const tagsQuery = useTags();
  const statusMutation = useUpdateIdeaStatus();
  const [activeIdea, setActiveIdea] = useState<PipelineIdea | null>(null);
  const [tagFilter, setTagFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<IdeaPriority | "">("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor),
  );

  function handleDragStart(event: DragStartEvent) {
    const idea = event.active.data.current?.idea as PipelineIdea | undefined;
    setActiveIdea(idea ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveIdea(null);

    const { active, over } = event;
    if (!over) {
      return;
    }

    const idea = active.data.current?.idea as PipelineIdea | undefined;
    const nextStatus = over.data.current?.status as IdeaStatus | undefined;
    if (!idea || !nextStatus || nextStatus === idea.status) {
      return;
    }

    statusMutation.mutate(
      { ideaId: idea.id, status: nextStatus },
      {
        onError: () => {
          toast.error(t("ideas.pipeline.moveError"));
        },
      },
    );
  }

  function handleDragCancel() {
    setActiveIdea(null);
  }

  const pipeline = query.data;

  const filteredPipeline = useMemo<IdeaPipeline>(() => {
    const result = {} as IdeaPipeline;
    for (const status of IDEA_STATUS_VALUES) {
      result[status] = (pipeline?.[status] ?? []).filter((idea) => {
        const tagMatch =
          !tagFilter || idea.tags.some(({ tagId }) => tagId === tagFilter);
        const priorityMatch = !priorityFilter || idea.priority === priorityFilter;
        return tagMatch && priorityMatch;
      });
    }
    return result;
  }, [pipeline, tagFilter, priorityFilter]);

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (query.isError) {
    return <p className="text-sm text-[var(--color-danger)]">{t("ideas.pipeline.loadError")}</p>;
  }

  if (!query.data) {
    return null;
  }

  return (
    <>
      <PipelineFilterBar
        tags={tagsQuery.data ?? []}
        tagId={tagFilter}
        priority={priorityFilter}
        onTagChange={setTagFilter}
        onPriorityChange={setPriorityFilter}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {IDEA_STATUS_VALUES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              ideas={filteredPipeline[status]}
            />
          ))}
        </div>
        <DragOverlay active={activeIdea} />
      </DndContext>
    </>
  );
}