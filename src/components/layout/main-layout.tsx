import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { SidebarNavItem } from "./sidebar-nav-item";
import { Bookmark, Folder, Settings, Star } from "lucide-react";
import { TopBar } from "./top-bar";
import { NODE_ENV } from "@/env";
import { TabViewType } from "@/types/tabs";

interface MainLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  activeView: TabViewType;
  onViewChange: (view: TabViewType) => void;
  horizontalPanelLabels?: [string, string];
}

const debug = NODE_ENV === "development";

chrome.windows.getCurrent({ populate: true }, (window) => {
  console.log("accurate window height", window.height, 'width', window.width);
});

export function MainLayout({ children, className, activeView, onViewChange, horizontalPanelLabels = ['Tabs', 'Chat'], ...props }: MainLayoutProps) {
  // Use the activeView and onViewChange props from App.tsx
  const handleViewChange = (view: TabViewType) => {
    onViewChange(view);
  };
  
  return (
    <div 
      className={cn(
        "flex max-h-screen max-w-screen overflow-hidden bg-gradient-to-br from-background to-muted/30",
        debug && "border-2 border-red-500",
        className
      )}
    >
      <Sidebar>
        <SidebarNavItem
          icon={<Bookmark className={cn("w-5 h-5", activeView === 'all' && "text-primary fill-primary")} />}
          label="All Tabs"
          isActive={activeView === 'all'}
          onClick={() => handleViewChange('all')}
        />
        <SidebarNavItem
          icon={<Star className={cn("w-5 h-5", activeView === 'favorites' && "text-yellow-400 fill-yellow-400")} />}
          label="Favorites"
          isActive={activeView === 'favorites'}
          onClick={() => handleViewChange('favorites')}
        />
        <SidebarNavItem
          icon={<Folder className={cn("w-5 h-5", activeView === 'collections' && "text-primary fill-primary")} />}
          label="Collections"
          isActive={activeView === 'collections'}
          onClick={() => handleViewChange('collections')}
        />
        <div className="flex-1" />
        <SidebarNavItem
          icon={<Settings className="w-5 h-5" />}
          label="Settings"
        />
      </Sidebar>
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar showChat={localStorage.getItem("showChat") === "true"} horizontalPanelLabels={horizontalPanelLabels} />
        <main
          className={cn("flex-1 overflow-y-auto p-6", className)}
          {...props}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
