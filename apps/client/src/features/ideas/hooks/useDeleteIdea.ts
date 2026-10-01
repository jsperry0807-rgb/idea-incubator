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
    onMutate: (ideaId) => {
      const previous = queryClient.getQueryData<IdeaPipeline>(PIPELINE_QUERY_KEY);

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

      void queryClient.cancelQueries({ queryKey: PIPELINE_QUERY_KEY });

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
