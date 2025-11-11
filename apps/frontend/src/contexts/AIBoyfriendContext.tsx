/**
 * 💬 AI BOYFRIEND CONTEXT
 * Global state management for AI companion chat and subscription upgrades
 */

'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface AIBoyfriendContextType {
  isChatOpen: boolean;
  isSubscriptionDialogOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  openSubscriptionDialog: () => void;
  closeSubscriptionDialog: () => void;
  userName: string;
  setUserName: (name: string) => void;
}

const AIBoyfriendContext = createContext<AIBoyfriendContextType | undefined>(undefined);

export function AIBoyfriendProvider({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [userName, setUserName] = useState('there');

  const openChat = () => setIsChatOpen(true);
  const closeChat = () => setIsChatOpen(false);
  const toggleChat = () => setIsChatOpen((prev) => !prev);

  const openSubscriptionDialog = () => {
    setIsSubscriptionDialogOpen(true);
    setIsChatOpen(false); // Close chat when opening subscription
  };

  const closeSubscriptionDialog = () => setIsSubscriptionDialogOpen(false);

  return (
    <AIBoyfriendContext.Provider
      value={{
        isChatOpen,
        isSubscriptionDialogOpen,
        openChat,
        closeChat,
        toggleChat,
        openSubscriptionDialog,
        closeSubscriptionDialog,
        userName,
        setUserName,
      }}
    >
      {children}
    </AIBoyfriendContext.Provider>
  );
}

export function useAIBoyfriend() {
  const context = useContext(AIBoyfriendContext);
  if (!context) {
    throw new Error('useAIBoyfriend must be used within AIBoyfriendProvider');
  }
  return context;
}
