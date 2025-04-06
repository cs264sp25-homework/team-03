import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { StartPage } from "@/pages/start-page";
import { useUser } from "@/hooks/useUser";
import { TabList } from "@/components/tabs/TabList";
import { TabSearch } from "@/components/tabs/TabSearch";

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

  if (!hasStarted) {
    return <StartPage onStart={() => setHasStarted(true)} />;
  }

  return (
    <MainLayout>
      <div className="flex flex-col w-full h-full">
        <TabSearch 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <TabList 
          tabs={tabs}
          searchQuery={searchQuery}
        />
      </div>
    </MainLayout>
  );
}

export default App;
