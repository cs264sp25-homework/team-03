import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactElement<{ isCollapsed?: boolean }>[];
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
        "group/sidebar relative flex h-screen flex-col overflow-hidden border-r bg-background px-3 pb-3 pt-2 transition-all duration-300",
        isCollapsed ? "w-[50px]" : "w-[180px]",
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
          {!isCollapsed && <span className="text-lg font-semibold">Tabs</span>}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      <div
        className={cn(
          "mt-4 flex-1 space-y-2",
          isCollapsed && "items-center justify-center"
        )}
      >
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { isCollapsed });
          }
          return child;
        })}
      </div>
    </aside>
  );
}
