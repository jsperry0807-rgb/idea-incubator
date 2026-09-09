import { DragOverlay as DndDragOverlay } from "@dnd-kit/core";
import type { PipelineIdea } from "@repo/shared";

import { KanbanCard } from "./KanbanCard";

export interface DragOverlayProps {
  active: PipelineIdea | null;
}

export function DragOverlay({ active }: DragOverlayProps) {
  return (
    <DndDragOverlay dropAnimation={{ duration: 200 }}>
      {active ? (
        <KanbanCard idea={active} className="rotate-2 cursor-grabbing shadow-lg" />
      ) : null}
    </DndDragOverlay>
  );
}