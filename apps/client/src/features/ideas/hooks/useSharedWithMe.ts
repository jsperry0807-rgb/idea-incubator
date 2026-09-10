import { useQuery } from "@tanstack/react-query";

import { getSharedWithMe } from "../api/shares";

export function useSharedWithMe() {
  return useQuery({
    queryKey: ["ideas", "shared"],
    queryFn: ({ signal }) => getSharedWithMe(signal),
    staleTime: 30_000,
  });
}