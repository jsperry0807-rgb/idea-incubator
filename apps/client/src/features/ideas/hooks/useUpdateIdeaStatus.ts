import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IDEA_STATUS_VALUES,
  type IdeaPipeline,
  type IdeaStatus,
  type PipelineIdea,
} from "@repo/shared";

import { updateIdeaStatus } from "../api/pipeline";

export interface UpdateIdeaStatusInput {
  ideaId: string;
  status: IdeaStatus;
}

const PIPELINE_QUERY_KEY = ["ideas", "pipeline"];

function emptyPipeline(): IdeaPipeline {
  return {
    IDEA: [],
    PLANNING: [],
    PLANNED: [],
    IN_PROGRESS: [],
    DONE: [],
    ARCHIVED: [],
  };
}

export function useUpdateIdeaStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ideaId, status }: UpdateIdeaStatusInput) =>
      updateIdeaStatus(ideaId, status),
    onMutate: ({ ideaId, status }) => {
      const previous = queryClient.getQueryData<IdeaPipeline>(
        PIPELINE_QUERY_KEY,
      );

      queryClient.setQueryData<IdeaPipeline>(
        PIPELINE_QUERY_KEY,
        (old) => {
          if (!old) {
            return old;
          }

          let moved: PipelineIdea | undefined;
          const next = emptyPipeline();

          for (const key of IDEA_STATUS_VALUES) {
            next[key] = old[key].filter((item) => {
              if (item.id !== ideaId) {
                return true;
              }
              moved = item;
              return false;
            });
          }

          if (moved) {
            next[status] = [{ ...moved, status }, ...next[status]];
          }

          return next;
        },
      );

      void queryClient.cancelQueries({ queryKey: PIPELINE_QUERY_KEY });

      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData<IdeaPipeline>(
          PIPELINE_QUERY_KEY,
          context.previous,
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
  });
}