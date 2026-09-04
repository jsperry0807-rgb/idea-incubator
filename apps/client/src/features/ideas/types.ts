import type { IdeaPriority, IdeaStatus } from "@repo/shared";

export type IdeaListSort = "createdAt" | "updatedAt" | "title";
export type IdeaListOrder = "asc" | "desc";

export type SortOptionValue =
  | "recent"
  | "oldest"
  | "alpha-asc"
  | "alpha-desc"
  | "updated";

export interface SortOption {
  value: SortOptionValue;
  sort: IdeaListSort;
  order: IdeaListOrder;
  labelKey: `ideas.sort.${SortOptionValue}`;
}

export interface IdeaFilters {
  status?: string;
  priority?: IdeaPriority | "";
  tagId?: string;
  search?: string;
  sort: IdeaListSort;
  order: IdeaListOrder;
}

export const SORT_OPTIONS: SortOption[] = [
  { value: "recent", sort: "createdAt", order: "desc", labelKey: "ideas.sort.recent" },
  { value: "oldest", sort: "createdAt", order: "asc", labelKey: "ideas.sort.oldest" },
  { value: "alpha-asc", sort: "title", order: "asc", labelKey: "ideas.sort.alpha-asc" },
  { value: "alpha-desc", sort: "title", order: "desc", labelKey: "ideas.sort.alpha-desc" },
  { value: "updated", sort: "updatedAt", order: "desc", labelKey: "ideas.sort.updated" },
];

export const STATUS_TABS: Array<IdeaStatus | "ALL"> = [
  "ALL",
  "IDEA",
  "PLANNING",
  "PLANNED",
  "IN_PROGRESS",
  "DONE",
  "ARCHIVED",
];