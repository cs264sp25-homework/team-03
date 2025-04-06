import { api } from "../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { TabWithRelations } from "@/types/tab";
import { useSessionQuery } from "convex-helpers/react/sessions";

export function useQueryTabs(groupId?: Id<"tabGroups">) {
  const tabs = useSessionQuery(api.tabs.getAll, {
    groupId,
  });

  return {
    data: tabs as TabWithRelations[],
    loading: tabs === undefined,
    error: tabs === null,
  };
}

export function useQueryTab(tabId: Id<"tabs">) {
  const tab = useSessionQuery(api.tabs.getOne, {
    tabId,
  });

  return {
    data: tab as TabWithRelations,
    loading: tab === undefined,
    error: tab === null,
  };
}