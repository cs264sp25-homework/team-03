import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { StartPage } from "@/pages/start-page";
import { useUser } from "@/hooks/useUser";

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
  
  const { userId, sessionId } = useUser();
  
  //TODO: remove this
  console.log("🔑 User ID:", userId);
  console.log("🔑 Session ID:", sessionId);

  useEffect(() => {
    localStorage.setItem("hasStarted", hasStarted.toString());
  }, [hasStarted]);

  useEffect(() => {
    chrome.runtime.sendMessage({type: "getTabs"}, (response) => {
      if (response && response.tabs) {
        setTabs(response.tabs);
        console.log("Tabs from React:", response.tabs);
      }
    });
  }, []);

  if (!hasStarted) {
    return <StartPage onStart={() => setHasStarted(true)} />;
  }

  return (
    <MainLayout>
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Your bookmarks will appear here. Start by adding some bookmarks!
        </p>
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



