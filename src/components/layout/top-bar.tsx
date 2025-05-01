import { cn } from "@/lib/utils";
import { NODE_ENV } from "@/env";

interface TopBarProps {
  className?: string;
}

const debug = NODE_ENV === "development";

export function TopBar({ className }: TopBarProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-2 border-b",
        debug && "border-2 border-blue-500",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">Tab Assist</h1>
      </div>
    </div>
  );
}
