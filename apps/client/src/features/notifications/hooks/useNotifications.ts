import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@features/auth/hooks/useAuth";
import { getNotifications } from "../api/notifications";

export function useNotifications() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["notifications"],
    queryFn: ({ signal }) => getNotifications(signal),
    enabled: isAuthenticated,
    refetchInterval: 60_000,
  });
}
