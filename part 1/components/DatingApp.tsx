import { useState } from "react";
import ExploreTab from "./tabs/ExploreTab";
import MessagesTab from "./tabs/MessagesTab";
import FavoritesTab from "./tabs/FavoritesTab";
import ProfileTab from "./tabs/ProfileTab";
import WalletTab from "./tabs/WalletTab";
import AIBoyfriendChat from "./ai/AIBoyfriendChat";
import BottomNav from "./navigation/BottomNav";

export default function DatingApp() {
  const [activeTab, setActiveTab] = useState<"explore" | "messages" | "favorites" | "ai" | "profile" | "wallet">("explore");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-amber-950 text-white">
      {/* Subtle animated background overlay */}
      <div className="fixed inset-0 bg-gradient-to-t from-amber-900/10 via-transparent to-purple-900/20 pointer-events-none" />
      
      {/* Main content area - optimized for profiles */}
      <div className="relative max-w-7xl mx-auto pb-20">
        {activeTab === "explore" && <ExploreTab />}
        {activeTab === "messages" && <MessagesTab />}
        {activeTab === "favorites" && <FavoritesTab />}
        {activeTab === "ai" && <AIBoyfriendChat />}
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "wallet" && <WalletTab />}
      </div>
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
