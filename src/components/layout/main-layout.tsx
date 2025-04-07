import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { SidebarNavItem } from "./sidebar-nav-item";
import { Bookmark, FolderOpen, Settings, Star } from "lucide-react";
import { TopBar } from "./top-bar";
import { NODE_ENV } from "@/env";
import { TabViewType } from "@/components/tabs/TabView";

interface MainLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const debug = NODE_ENV === "development";

chrome.windows.getCurrent({ populate: true }, (window) => {
  console.log("accurate window height", window.height, 'width', window.width);
});

export function MainLayout({ children, className, ...props }: MainLayoutProps) {
  const [activeView, setActiveView] = useState<TabViewType>('all');
  
  const handleViewChange = (view: TabViewType) => {
    setActiveView(view);
  };
  
  return (
    <div 
      className={cn(
        "flex max-h-screen max-w-screen overflow-hidden",
        debug && "border-2 border-red-500",
        className
      )}
    >
      <Sidebar>
        <SidebarNavItem
          icon={<Bookmark />}
          label="All Tabs"
          isActive={activeView === 'all'}
          onClick={() => handleViewChange('all')}
        />
        <SidebarNavItem
          icon={<Star />}
          label="Favorites"
          isActive={activeView === 'favorites'}
          onClick={() => handleViewChange('favorites')}
        />
        <SidebarNavItem
          icon={<FolderOpen />}
          label="Collections"
          isActive={activeView === 'collections'}
          onClick={() => handleViewChange('collections')}
        />
        <div className="flex-1" />
        <SidebarNavItem
          icon={<Settings />}
          label="Settings"
        />
      </Sidebar>
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main
          className={cn("flex-1 overflow-y-auto p-4", className)}
          {...props}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
