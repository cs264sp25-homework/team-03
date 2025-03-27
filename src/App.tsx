import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { StartPage } from "@/pages/start-page";
import { useUser } from "@/hooks/useUser";

declare global {
  interface Window {
    chrome: typeof chrome;
  }
}

function App() {
  const [hasStarted, setHasStarted] = useState(() => {
    return localStorage.getItem("hasStarted") === "true";
  });
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  useUser();

  useEffect(() => {
    localStorage.setItem("hasStarted", hasStarted.toString());
  }, [hasStarted]);

  useEffect(() => {
    chrome.runtime.sendMessage({type: "getTabs"}, (response) => {
      if (response && response.tabs) {
        setTabs(response.tabs);
      }
    });
  }, []);

  const filteredTabs = tabs.filter(tab => 
    tab.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tab.url?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!hasStarted) {
    return <StartPage onStart={() => setHasStarted(true)} />;
  }

  return (
    <MainLayout>
      <div className="space-y-4 w-full">
        <div className="sticky top-0 bg-background pt-2 pb-4 border-b">
          <input
            type="text"
            placeholder="Search tabs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-600 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground placeholder-gray-500"
          />
        </div>
        
        <div className="space-y-4">
          <div className="grid gap-3">
            {filteredTabs.map((tab) => (
              <div
                key={tab.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-600 dark:border-gray-700 bg-background hover:bg-muted transition-colors cursor-pointer"
                onClick={() => chrome.tabs.update(tab.id!, { active: true })}
              >
                {tab.favIconUrl && (
                  <img
                    src={tab.favIconUrl}
                    alt=""
                    className="w-4 h-4 mt-1 flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-foreground truncate">
                    {tab.title}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {tab.url}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {filteredTabs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No matching tabs found" : "No open tabs"}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default App;
