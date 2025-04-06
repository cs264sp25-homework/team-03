export function ChatPlaceholder() {
  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <h3 className="text-lg font-semibold">Chat View</h3>
          <p className="text-sm">Select a chat to start messaging</p>
        </div>
      </div>
    </div>
  );
} 