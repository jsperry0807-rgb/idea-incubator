import { useQuery } from "@tanstack/react-query";

import { getPipeline } from "../api/pipeline";

export function usePipeline() {
  return useQuery({
    queryKey: ["ideas", "pipeline"],
    queryFn: ({ signal }) => getPipeline(signal),
    staleTime: 30_000,
  });
}