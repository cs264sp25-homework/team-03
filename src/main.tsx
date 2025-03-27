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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

