import "@/index.css"; // Keep this line at the top so richColors can be used in the Toaster
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App.tsx";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/providers";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </Providers>
  </StrictMode>,
);
