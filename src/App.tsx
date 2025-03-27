/*import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { StartPage } from "@/pages/start-page";

function App() {
  const [hasStarted, setHasStarted] = useState(() => {
    return localStorage.getItem("hasStarted") === "true";
  });

  useEffect(() => {
    localStorage.setItem("hasStarted", hasStarted.toString());
  }, [hasStarted]);

  if (!hasStarted) {
    return <StartPage onStart={() => setHasStarted(true)} />;
  }

  return (
    <MainLayout>
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Your bookmarks will appear here. Start by adding some bookmarks!
        </p>
      </div>
    </MainLayout>
  );
}

export default App;*/

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { StartPage } from "@/pages/start-page";

// Add Chrome types
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

  useEffect(() => {
    localStorage.setItem("hasStarted", hasStarted.toString());
  }, [hasStarted]);

  // Add this effect to get tabs
  useEffect(() => {
    // Send message to background script to get tabs
    chrome.runtime.sendMessage({type: "getTabs"}, (response) => {
      if (response && response.tabs) {
        setTabs(response.tabs);
        console.log("Tabs from React:", response.tabs);
      }
    });
  }, []); // Empty dependency array means this runs once when component mounts

  if (!hasStarted) {
    return <StartPage onStart={() => setHasStarted(true)} />;
  }

  return (
    <MainLayout>
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Your bookmarks will appear here. Start by adding some bookmarks!
        </p>
        {/* Add this to display tabs */}
        <div>
          <h2>Open Tabs:</h2>
          <ul>
            {tabs.map((tab) => (
              <li key={tab.id}>
                {tab.title} - {tab.url}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </MainLayout>
  );
}

export default App;



