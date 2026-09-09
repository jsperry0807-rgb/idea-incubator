import type { CreateIdeaInput, Idea, PaginationMeta } from "@repo/shared";

import { client } from "@/axios";
import type { IdeaFilters } from "../types";

export interface IdeasResult {
  items: Idea[];
  meta: PaginationMeta;
}

export async function getIdeas(
  filters: IdeaFilters,
  signal?: AbortSignal,
): Promise<IdeasResult> {
  const params: Record<string, string | undefined> = {
    status: filters.status || undefined,
    priority: filters.priority || undefined,
    tagId: filters.tagId || undefined,
    search: filters.search || undefined,
    sort: filters.sort,
    order: filters.order,
  };

  const { data } = await client.get<{ data: Idea[]; meta: PaginationMeta }>("/ideas", {
    params,
    signal,
  });

  return { items: data.data, meta: data.meta };
}

export async function getIdea(id: string): Promise<Idea> {
  const { data } = await client.get<{ data: Idea }>(`/ideas/${id}`);
  return data.data;
}

export async function createIdea(input: CreateIdeaInput): Promise<Idea> {
  const { data } = await client.post<{ data: Idea }>("/ideas", input);
  return data.data;
}