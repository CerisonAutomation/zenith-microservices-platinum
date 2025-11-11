import { Grid3x3, MessageCircle, Heart, Bot, User, Wallet } from "lucide-react";
import { motion } from "framer-motion";

interface BottomNavProps {
  activeTab: "explore" | "messages" | "favorites" | "ai" | "profile" | "wallet";
  onTabChange: (tab: "explore" | "messages" | "favorites" | "ai" | "profile" | "wallet") => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "explore" as const, icon: Grid3x3, label: "Explore" },
    { id: "messages" as const, icon: MessageCircle, label: "Messages" },
    { id: "favorites" as const, icon: Heart, label: "Favorites" },
    { id: "ai" as const, icon: Bot, label: "AI Love" },
    { id: "profile" as const, icon: User, label: "Profile" },
    { id: "wallet" as const, icon: Wallet, label: "Wallet" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-900/95 via-purple-800/95 to-amber-900/95 backdrop-blur-xl border-t border-amber-500/20 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around items-center h-20">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative flex flex-col items-center justify-center gap-1 px-4 py-2 transition-all duration-300"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-2xl border border-amber-500/30"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon
                  className={`w-6 h-6 relative z-10 transition-colors duration-300 ${
                    isActive ? "text-amber-300" : "text-amber-200/40"
                  }`}
                />
                <span
                  className={`text-xs relative z-10 transition-colors duration-300 font-light ${
                    isActive ? "text-amber-300" : "text-amber-200/40"
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
}
