//import * as React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface StartPageProps {
  onStart: () => void;
}

export function StartPage({ onStart }: StartPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center">
      <div className="space-y-6 px-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold sm:text-5xl">Welcome to TabAssist</h1>
          <p className="text-muted-foreground">
            Your personal space for organizing and managing tabs
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="mx-auto max-w-[600px] space-y-2 text-center">
            <p>
              Organize your tabs efficiently with our powerful features:
            </p>
            <ul className="text-muted-foreground">
              <li>✨ Save and organize tabs</li>
              <li>📂 Create collections</li>
              <li>⭐️ Mark favorites</li>
              <li>🔍 Quick search</li>
              <li>🌙 Dark mode support</li>
            </ul>
          </div>
          
          <Button
            onClick={onStart}
            size="lg"
            className="gap-2"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
