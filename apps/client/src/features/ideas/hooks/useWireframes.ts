import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deleteWireframe, getWireframe, listWireframes, uploadWireframe } from '../api/wireframes';

const WIREFRAMES_KEY = (ideaId: string) => ['ideas', ideaId, 'wireframes'] as const;

export function useWireframes(ideaId: string) {
  return useQuery({
    queryKey: WIREFRAMES_KEY(ideaId),
    queryFn: () => listWireframes(ideaId),
    enabled: Boolean(ideaId),
  });
}

export function useWireframe(ideaId: string, name: string | null) {
  return useQuery({
    queryKey: [...WIREFRAMES_KEY(ideaId), name],
    queryFn: () => getWireframe(ideaId, name!),
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
