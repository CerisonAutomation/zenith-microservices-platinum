'use client';

import { Grid3x3, MessageCircle, Heart, User, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, memo } from "react";

interface BottomNavProps {
  activeTab: "explore" | "messages" | "favorites" | "profile" | "wallet";
  onTabChange: (tab: "explore" | "messages" | "favorites" | "profile" | "wallet") => void;
}

const BottomNav = memo(function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "explore" as const, icon: Grid3x3, label: "Explore" },
    { id: "messages" as const, icon: MessageCircle, label: "Messages" },
    { id: "favorites" as const, icon: Heart, label: "Favorites" },
    { id: "profile" as const, icon: User, label: "Profile" },
    { id: "wallet" as const, icon: Wallet, label: "Wallet" },
  ];

  const handleTabClick = useCallback((tabId: typeof tabs[number]['id']) => {
    onTabChange(tabId);
  }, [onTabChange]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/40 backdrop-blur-xl border-t border-white/10 z-50" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around items-center h-20" role="tablist">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className="relative flex flex-col items-center justify-center gap-1 px-4 py-2 transition-all"
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
                role="tab"
                aria-selected={isActive}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    aria-hidden="true"
                  />
                )}
                <Icon
                  className={`w-6 h-6 relative z-10 transition-colors ${
                    isActive ? "text-pink-400" : "text-gray-400"
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`text-xs relative z-10 transition-colors ${
                    isActive ? "text-pink-400 font-medium" : "text-gray-400"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
});

export default BottomNav;
