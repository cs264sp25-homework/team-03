import { useEffect, useState } from "react";
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

export default App;
