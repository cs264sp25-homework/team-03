import { useTabGroups } from "../hooks/useTabGroups";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function TabGroupButton() {
  const { createGroupWithAllTabs, isLoading, error } = useTabGroups();
  const [groupName, setGroupName] = useState("");

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    
    try {
      const result = await createGroupWithAllTabs(groupName.trim(), "blue");
      console.log("Created group with", result.tabCount, "tabs");
    } catch (err) {
      console.error("Failed to create group:", err);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex gap-2">
        <Input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Enter group name"
          className={cn(
            "flex-1 border-gray-200 dark:border-gray-800",
            "focus:ring-0 focus:ring-offset-0"
          )}
          disabled={isLoading}
        />
        <Button
          onClick={handleCreateGroup}
          disabled={isLoading || !groupName.trim()}
        >
          {isLoading ? "Creating..." : "Create Group"}
        </Button>
      </div>
      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  );
} 