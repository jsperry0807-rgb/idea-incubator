import { Card } from "@repo/ui";

import type { Idea } from "@repo/shared";
import { PriorityDot } from "./PriorityDot";
import { StatusBadge } from "./StatusBadge";
import { TagBadge } from "./TagBadge";

export function IdeaCard({ idea }: { idea: Idea }) {
  return (
    <Card className="flex flex-col gap-3 p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <PriorityDot priority={idea.priority} />
          <StatusBadge status={idea.status} />
        </div>
      </div>

      <h3 className="text-base font-semibold text-[var(--color-fg)]">{idea.title}</h3>

      {idea.description ? (
        <p className="line-clamp-2 text-sm text-[var(--color-muted)]">{idea.description}</p>
      ) : null}

      {idea.tags.length > 0 ? (
        <div className="mt-auto flex flex-wrap gap-1.5">
          {idea.tags.map(({ tagId, tag }) => (
            <TagBadge key={tagId} tag={tag} />
          ))}
        </div>
      ) : null}
    </Card>
  );
}