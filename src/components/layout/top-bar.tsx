import * as React from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

interface TopBarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function TopBar({ className, ...props }: TopBarProps) {
  return (
    <div
      className={cn(
        "h-14 border-b bg-background px-4 flex items-center justify-between",
        className
      )}
      {...props}
    >
      <div className="font-semibold">Bookmarks</div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </div>
  );
}
