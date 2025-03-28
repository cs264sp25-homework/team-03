import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarNavItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  label: string;
  isCollapsed?: boolean;
  isActive?: boolean;
  showTooltip?: boolean;
}

export function SidebarNavItem({
  icon,
  label,
  isCollapsed = false,
  isActive = false,
  showTooltip = true,
  className,
  ...props
}: SidebarNavItemProps) {

  const content = (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className={cn(
        "w-full",
        isCollapsed ? "px-2 justify-center" : "px-3 justify-start",
        className
      )}
      {...props}
    >
      {icon}
      {!isCollapsed && <span>{label}</span>}
    </Button>
  );

  if (isCollapsed && showTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
