import { useEffect } from 'react';
import { removeTabByUrl } from '../utils/tab-removal';

export function useTabRemoval() {
  console.log('useTabRemoval hook mounted');

  useEffect(() => {
    console.log('useTabRemoval effect running');
    
    const handleTabRemoved = async (message: any) => {
      console.log('useTabRemoval received message:', message);
      if (message.type === 'tabRemoved') {
        console.log('Tab removed message received:', message);
        await removeTabByUrl(message.url);
      } else {
        console.log('Received non-tabRemoved message:', message.type);
      }
    };

    console.log('Adding message listener');
    chrome.runtime.onMessage.addListener(handleTabRemoved);

    return () => {
      console.log('useTabRemoval cleanup');
      chrome.runtime.onMessage.removeListener(handleTabRemoved);
    };
  }, []);
} 