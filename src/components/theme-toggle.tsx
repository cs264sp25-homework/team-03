import { Computer, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // Determine which theme is active
  const isLightTheme = theme === "light";
  const isDarkTheme = theme === "dark";
  const isSystemTheme = theme === "system";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative w-8 h-8 hover:bg-transparent"
        >
          <Sun
            className={`h-4 w-4 transition-all absolute text-foreground ${
              isLightTheme ? "scale-100 rotate-0" : "scale-0 rotate-90"
            }`}
          />
          <Moon
            className={`h-4 w-4 transition-all absolute text-foreground ${
              isDarkTheme ? "scale-100 rotate-0" : "scale-0 rotate-90"
            }`}
          />
          <Computer
            className={`h-4 w-4 transition-all absolute text-foreground ${
              isSystemTheme ? "scale-100 rotate-0" : "scale-0 rotate-90"
            }`}
          />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      >
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Computer className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}