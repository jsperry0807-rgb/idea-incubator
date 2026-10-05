import { useQuery } from '@tanstack/react-query';

import { getIdea } from '../api/ideas';

export function useIdea(id: string) {
  return useQuery({
    queryKey: ['ideas', id],
    // The signal lets react-query abandon the request when the component
    // unmounts or `id` changes, so navigating idea-to-idea does not leave the
    // previous request in flight racing the new one.
    queryFn: ({ signal }) => getIdea(id, signal),
    enabled: Boolean(id),
  });
}
