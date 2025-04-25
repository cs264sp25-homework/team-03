import { Collection } from "@/hooks/useCollections";
import { cn } from "@/lib/utils";
import { Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";

// Color palette for collection backgrounds
const colorPalettes = [
  { bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-100 dark:border-blue-900/50', hover: 'hover:bg-blue-100/50 dark:hover:bg-blue-900/30' },
  { bg: 'bg-green-50 dark:bg-green-950/40', border: 'border-green-100 dark:border-green-900/50', hover: 'hover:bg-green-100/50 dark:hover:bg-green-900/30' },
  { bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-100 dark:border-amber-900/50', hover: 'hover:bg-amber-100/50 dark:hover:bg-amber-900/30' },
  { bg: 'bg-purple-50 dark:bg-purple-950/40', border: 'border-purple-100 dark:border-purple-900/50', hover: 'hover:bg-purple-100/50 dark:hover:bg-purple-900/30' },
  { bg: 'bg-pink-50 dark:bg-pink-950/40', border: 'border-pink-100 dark:border-pink-900/50', hover: 'hover:bg-pink-100/50 dark:hover:bg-pink-900/30' },
  { bg: 'bg-indigo-50 dark:bg-indigo-950/40', border: 'border-indigo-100 dark:border-indigo-900/50', hover: 'hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30' },
  { bg: 'bg-teal-50 dark:bg-teal-950/40', border: 'border-teal-100 dark:border-teal-900/50', hover: 'hover:bg-teal-100/50 dark:hover:bg-teal-900/30' },
  { bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-100 dark:border-rose-900/50', hover: 'hover:bg-rose-100/50 dark:hover:bg-rose-900/30' },
];

interface CollectionCardProps {
  collection: Collection;
  onDelete: (id: string) => void;
  onSelect: (collection: Collection) => void;
  onChat?: (collection: Collection) => void;
}

export function CollectionCard({ collection, onDelete, onSelect, onChat }: CollectionCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  
  // Get up to 4 favicon URLs for the grid display
  const favicons = collection.tabs
    .slice(0, 4)
    .map(tab => tab.favIconUrl || null);
  
  // Fill with placeholder colors if we have fewer than 4 tabs
  while (favicons.length < 4) {
    favicons.push(null);
  }
  
  // Format the date
  const formattedDate = new Date(collection.createdAt).toLocaleDateString();
  
  // Generate a consistent color palette based on collection id
  const colorPalette = useMemo(() => {
    // Use the collection id to generate a consistent index
    const colorIndex = collection.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colorPalettes.length;
    return colorPalettes[colorIndex];
  }, [collection.id]);
  
  return (
    <div 
      className={`relative flex flex-col p-4 transition-all duration-200 border shadow-sm rounded-xl ${colorPalette.bg} ${colorPalette.border} ${colorPalette.hover} hover:shadow-md group cursor-pointer`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={() => onSelect(collection)}
    >
      {/* Grid of favicons in a 2x2 layout with improved styling */}
      <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors mb-3 px-1">{collection.name}</h3>
      <div className="grid grid-cols-2 gap-2 mb-3 overflow-hidden rounded-xl aspect-square w-28 h-28 mx-auto bg-white/80 dark:bg-gray-900/60 p-2 shadow-inner group-hover:shadow transition-all duration-300">
        {favicons.map((favicon, index) => (
          <div 
            key={index}
            className={cn(
              "flex items-center justify-center rounded-lg overflow-hidden transition-transform duration-300 group-hover:scale-105",
              !favicon && [
                "bg-blue-100/70 dark:bg-blue-900/30",
                "bg-green-100/70 dark:bg-green-900/30",
                "bg-amber-100/70 dark:bg-amber-900/30",
                "bg-indigo-100/70 dark:bg-indigo-900/30"
              ][index]
            )}
            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
          >
            {favicon ? (
              <img 
                src={favicon} 
                alt="" 
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {index + 1}
              </span>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-between px-1 mt-1">
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-primary/5 text-primary/90 dark:text-primary/80 rounded-full">{collection.tabs.length} tabs</span>
        <span className="text-xs text-muted-foreground/70">{formattedDate}</span>
      </div>
      
      <div className="absolute top-3 right-3 flex gap-2">
        {onChat && (
          <Button
            variant="ghost"
            size="icon"
            className={`p-1.5 rounded-full bg-background/90 hover:bg-primary/10 transition-all duration-200 ${isHovering ? 'opacity-100 scale-100' : 'opacity-0 scale-90'} shadow-sm`}
            onClick={(e) => {
              e.stopPropagation();
              onChat(collection);
            }}
          >
            <MessageSquare className="w-4 h-4 text-primary" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={`p-1.5 rounded-full bg-background/90 hover:bg-destructive/10 transition-all duration-200 ${isHovering ? 'opacity-100 scale-100' : 'opacity-0 scale-90'} shadow-sm`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(collection.id);
          }}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
