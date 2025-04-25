import * as React from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

interface TopBarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function TopBar({ className, ...props }: TopBarProps) {
  return (
    <div
      className={cn(
        "h-16 border-b bg-background px-6 flex items-center justify-between shadow-sm",
        className
      )}
      {...props}
    >
      <div className="flex items-center">
        <div>
          <span className="text-lg font-semibold text-primary">TabAssist</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
      </div>
    </div>
  );
}
