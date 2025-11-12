import { Grid3x3, MessageCircle, Heart, User, Wallet, Crown } from "lucide-react";
import { motion } from "framer-motion";

interface BottomNavProps {
  activeTab: "explore" | "messages" | "favorites" | "profile" | "wallet" | "platinum";
  onTabChange: (tab: "explore" | "messages" | "favorites" | "profile" | "wallet" | "platinum") => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "explore" as const, icon: Grid3x3, label: "Explore" },
    { id: "platinum" as const, icon: Crown, label: "Platinum", isPremium: true },
    { id: "messages" as const, icon: MessageCircle, label: "Messages" },
    { id: "favorites" as const, icon: Heart, label: "Favorites" },
    { id: "profile" as const, icon: User, label: "Profile" },
    { id: "wallet" as const, icon: Wallet, label: "Wallet" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/40 backdrop-blur-xl border-t border-white/10 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around items-center h-20">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            const isPlatinum = tab.id === "platinum";

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative flex flex-col items-center justify-center gap-1 px-4 py-2 transition-all"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute inset-0 rounded-2xl ${
                      isPlatinum
                        ? "bg-gradient-to-r from-amber-500/20 to-yellow-600/20"
                        : "bg-gradient-to-r from-purple-500/20 to-pink-500/20"
                    }`}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon
                  className={`w-6 h-6 relative z-10 transition-colors ${
                    isActive
                      ? isPlatinum
                        ? "text-amber-400"
                        : "text-pink-400"
                      : "text-gray-400"
                  }`}
                />
                <span
                  className={`text-xs relative z-10 transition-colors ${
                    isActive
                      ? isPlatinum
                        ? "text-amber-400 font-medium"
                        : "text-pink-400 font-medium"
                      : "text-gray-400"
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
