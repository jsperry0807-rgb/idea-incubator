import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IDEA_STATUS_VALUES, type IdeaPipeline, type PipelineIdea } from '@repo/shared';

import { deleteIdea } from '../api/ideas';

const PIPELINE_QUERY_KEY = ['ideas', 'pipeline'];

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

export function useDeleteIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ideaId: string) => deleteIdea(ideaId),
    onMutate: async (ideaId) => {
      const previous = queryClient.getQueryData<IdeaPipeline>(PIPELINE_QUERY_KEY);

      // Cancel first, and await it. Cancelling afterwards was both too late (the
      // optimistic write could already have been overwritten) and un-awaited (an
      // in-flight response could resolve and restore the deleted card).
      await queryClient.cancelQueries({ queryKey: PIPELINE_QUERY_KEY });

      queryClient.setQueryData<IdeaPipeline>(PIPELINE_QUERY_KEY, (old) => {
        if (!old) {
          return old;
        }

        const next = emptyPipeline();

        for (const key of IDEA_STATUS_VALUES) {
          next[key] = old[key].filter((item: PipelineIdea) => item.id !== ideaId);
        }

        return next;
      });

      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData<IdeaPipeline>(PIPELINE_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['ideas'] });
    },
  });
}
