import * as React from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { FileText, FolderOpen, MessageSquare } from "lucide-react";

interface TopBarProps extends React.HTMLAttributes<HTMLDivElement> {
  showChat: boolean;
  horizontalPanelLabels?: [string, string];
}

export function TopBar({ className, showChat, horizontalPanelLabels = ['Tabs', 'Chat'], ...props }: TopBarProps) {
  return (
    <div
      className={cn(
        "h-16 border-b bg-background px-6 flex items-center justify-between shadow-sm",
        className
      )}
      {...props}
    >
      <div className="flex items-center">
        <div className="mr-4">
          <span className="text-lg font-semibold text-primary">TabAssist</span>
        </div>
        <div className="flex bg-muted/30 rounded-full p-1">
          <button
            className={`px-4 py-1.5 flex items-center justify-center gap-2 rounded-full transition-all duration-200 ${
              !showChat ? 'bg-white dark:bg-gray-800 shadow-sm' : 'hover:bg-muted/50'
            }`}
            onClick={() => {
              localStorage.setItem("showChat", "false");
              window.location.reload();
            }}
          >
            <FileText className="w-4 h-4" />
            <span className="font-medium">{horizontalPanelLabels[0]}</span>
          </button>
          <button
            className={`px-4 py-1.5 flex items-center justify-center gap-2 rounded-full transition-all duration-200 ${
              showChat ? 'bg-white dark:bg-gray-800 shadow-sm' : 'hover:bg-muted/50'
            }`}
            onClick={() => {
              localStorage.setItem("showChat", "true");
              window.location.reload();
            }}
          >
            {horizontalPanelLabels[1] === 'Groups' ? (
              <FolderOpen className="w-4 h-4" />
            ) : (
              <MessageSquare className="w-4 h-4" />
            )}
            <span className="font-medium">{horizontalPanelLabels[1]}</span>
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
      </div>
    </div>
  );
}
