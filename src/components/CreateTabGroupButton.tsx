import { useTabGroups } from "../hooks/useTabGroups";
import { useState } from "react";

export function CreateTabGroupButton() {
  const { createGroupWithAllTabs, isLoading, error } = useTabGroups();
  const [groupName, setGroupName] = useState("");

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    
    try {
      const result = await createGroupWithAllTabs(groupName.trim());
      console.log("Created group with", result.tabCount, "tabs");
      setGroupName(""); // Clear input after success
    } catch (err) {
      console.error("Failed to create group:", err);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Enter group name"
          className="flex-1 px-3 py-2 border rounded-md"
          disabled={isLoading}
        />
        <button
          onClick={handleCreateGroup}
          disabled={isLoading || !groupName.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isLoading ? "Creating..." : "Create Group"}
        </button>
      </div>
      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  );
} 