import { api } from "../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { TabWithRelations } from "@/types/tab";
import { useSessionQuery } from "convex-helpers/react/sessions";
import { useMemo } from "react";

export function useQueryTabs() {
  const tabs = useSessionQuery(api.tabs.getAll, {});

  // Create a map of URL -> tab for O(1) lookup
  const { tabsByUrl, extractedUrls } = useMemo(() => {
    if (!tabs) return { tabsByUrl: new Map(), extractedUrls: new Set() };
    
    const urlMap = new Map<string, TabWithRelations>();
    const extractedSet = new Set<string>();
    
    for (const tab of tabs) {
      urlMap.set(tab.url, tab);
      if (tab.content != null) {
        extractedSet.add(tab.url);
      }
    }
    
    return {
      tabsByUrl: urlMap,
      extractedUrls: extractedSet
    };
  }, [tabs]);

  const findTabByUrl = (url: string) => {
    return tabsByUrl.get(url) ?? null;
  };

  const isTabExtracted = (url: string) => {
    return extractedUrls.has(url);
  };

  return {
    data: tabs,
    loading: tabs === undefined,
    error: tabs === null,
    findTabByUrl,
    isTabExtracted,
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