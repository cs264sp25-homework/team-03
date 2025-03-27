import * as React from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { SidebarNavItem } from "./sidebar-nav-item";
import { Bookmark, FolderOpen, Settings, Star } from "lucide-react";
import { TopBar } from "./top-bar";

interface MainLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function MainLayout({ children, className, ...props }: MainLayoutProps) {
  return (
    <div className="flex h-screen w-full">
      <Sidebar>
        <SidebarNavItem
          icon={<Bookmark />}
          label="All Tabs"
          isActive
        />
        <SidebarNavItem
          icon={<Star />}
          label="Favorites"
        />
        <SidebarNavItem
          icon={<FolderOpen />}
          label="Collections"
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
