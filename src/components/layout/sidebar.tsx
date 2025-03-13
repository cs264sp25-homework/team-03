import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}

export function Sidebar({
  children,
  defaultCollapsed = false,
  className,
  ...props
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  return (
    <aside
      className={cn(
        "group/sidebar relative flex h-screen flex-col overflow-y-auto border-r bg-background px-3 pb-3 pt-2 transition-all duration-300",
        isCollapsed ? "w-[50px]" : "w-[240px]",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex items-center gap-2 transition-all duration-300",
            isCollapsed && "opacity-0"
          )}
        >
          {!isCollapsed && <span className="text-lg font-semibold">Bookmarks</span>}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div
        className={cn(
          "mt-4 flex-1 space-y-2",
          isCollapsed && "items-center justify-center"
        )}
      >
        {children}
      </div>
    </aside>
  );
}
