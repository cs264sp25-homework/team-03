interface TabSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function TabSearch({ searchQuery, onSearchChange }: TabSearchProps) {
  return (
    <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
      <div className="px-4 py-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search tabs..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 placeholder-gray-400 border border-gray-200 rounded-xl dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground shadow-sm transition-all duration-200 hover:shadow-md"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
} 