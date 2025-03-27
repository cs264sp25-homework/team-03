/*import "@/index.css"; // Keep this line at the top so richColors can be used in the Toaster
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.tsx'
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/providers";

// Add Chrome extension specific styles
const style = document.createElement('style')
style.textContent = `
  body {
    width: 400px;
    min-height: 400px;
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }
`
document.head.appendChild(style)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Providers>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </Providers>
  </React.StrictMode>,
)*/


import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

//convex user session wrapper
import { SessionProvider } from "convex-helpers/react/sessions";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useLocalStorage } from "usehooks-ts";

// Initialize the Convex client
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConvexProvider client={convex}>
      <SessionProvider 
        useStorage={useLocalStorage}
        storageKey="TabAssistSessionId"
      >
        <App />
      </SessionProvider>
    </ConvexProvider>
  </React.StrictMode>,
)



