//use for tabGroup queries (getall) and getTabsInGroup 

import { api } from "../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useSessionQuery } from "convex-helpers/react/sessions";
import { Doc } from "convex/_generated/dataModel";


//TODO: might have type erros

export function useQueryTabGroups() {
  const tabGroups = useSessionQuery(api.tabGroups.getAll, {});

  return {
    data: tabGroups ? (tabGroups as Doc<"tabGroups">[]) : [],
    loading: tabGroups === undefined,
    error: tabGroups === null,
  };
}

export function useQueryTabsInGroup(tabGroupId: Id<"tabGroups">) {
  const tabs = useSessionQuery(api.tabGroups.getTabsInGroup, {
    tabGroupId: tabGroupId as unknown as never
  });

  return {
    data: tabs ? (tabs as Doc<"tabs">[]) : [],
    loading: tabs === undefined,
    error: tabs === null,
  };
}

