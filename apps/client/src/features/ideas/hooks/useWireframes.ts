import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deleteWireframe, getWireframe, listWireframes, uploadWireframe } from '../api/wireframes';

const WIREFRAMES_KEY = (ideaId: string) => ['ideas', ideaId, 'wireframes'] as const;

export function useWireframes(ideaId: string) {
  return useQuery({
    queryKey: WIREFRAMES_KEY(ideaId),
    // Signal forwarded so leaving the page aborts the request instead of letting
    // it resolve into a cache nobody is reading.
    queryFn: ({ signal }) => listWireframes(ideaId, signal),
    enabled: Boolean(ideaId),
  });
}

export function useWireframe(ideaId: string, name: string | null) {
  return useQuery({
    queryKey: [...WIREFRAMES_KEY(ideaId), name],
    queryFn: ({ signal }) => getWireframe(ideaId, name!, signal),
    enabled: Boolean(ideaId && name),
  });
}

export function useUploadWireframe(ideaId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, html }: { name: string; html: string }) =>
      uploadWireframe(ideaId, name, html),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WIREFRAMES_KEY(ideaId) });
    },
  });
}

export function useDeleteWireframe(ideaId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => deleteWireframe(ideaId, name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WIREFRAMES_KEY(ideaId) });
    },
  });
}
