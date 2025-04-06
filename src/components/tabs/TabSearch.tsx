interface TabSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function TabSearch({ searchQuery, onSearchChange }: TabSearchProps) {
  return (
    <div className="sticky top-0 z-10 border-b bg-background">
      <div className="px-4 py-3">
        <input
          type="text"
          placeholder="Search tabs..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-2 placeholder-gray-500 border border-gray-600 rounded-lg dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
        />
      </div>
    </div>
  );
} 