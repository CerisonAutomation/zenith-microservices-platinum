import { useState } from "react";
import ExploreTab from "./tabs/ExploreTab";
import MessagesTab from "./tabs/MessagesTab";
import FavoritesTab from "./tabs/FavoritesTab";
import ProfileTab from "./tabs/ProfileTab";
import WalletTab from "./tabs/WalletTab";
import BottomNav from "./navigation/BottomNav";

export default function DatingApp() {
  const [activeTab, setActiveTab] = useState<"explore" | "messages" | "favorites" | "profile" | "wallet">("explore");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 text-white">
      <div className="max-w-7xl mx-auto pb-20">
        {activeTab === "explore" && <ExploreTab />}
        {activeTab === "messages" && <MessagesTab />}
        {activeTab === "favorites" && <FavoritesTab />}
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "wallet" && <WalletTab />}
      </div>
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
