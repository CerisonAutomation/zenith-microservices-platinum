import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MoreVertical } from "lucide-react";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import ChatWindow from "../chat/ChatWindow";

const mockChats = [
  {
    id: "1",
    name: "Alex",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
    lastMessage: "Hey! How are you doing?",
    timestamp: "2m ago",
    unread: 2,
    online: true,
  },
  {
    id: "2",
    name: "Jordan",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    lastMessage: "That sounds great!",
    timestamp: "1h ago",
    unread: 0,
    online: true,
  },
  {
    id: "3",
    name: "Sam",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80",
    lastMessage: "See you tomorrow 👋",
    timestamp: "3h ago",
    unread: 0,
    online: false,
  },
];

export default function MessagesTab() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = mockChats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedChat) {
    const chat = mockChats.find(c => c.id === selectedChat);
    return chat ? (
      <ChatWindow
        chat={chat}
        onBack={() => setSelectedChat(null)}
      />
    ) : null;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Messages
          </h1>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className="divide-y divide-white/10">
        {filteredChats.map((chat, index) => (
          <motion.div
            key={chat.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setSelectedChat(chat.id)}
            className="px-4 py-4 hover:bg-white/5 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-14 h-14 border-2 border-white/10">
                  <AvatarImage src={chat.avatar} />
                  <AvatarFallback>{chat.name[0]}</AvatarFallback>
                </Avatar>
                {chat.online && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-black" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-white truncate">{chat.name}</h3>
                  <span className="text-xs text-gray-400">{chat.timestamp}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400 truncate">{chat.lastMessage}</p>
                  {chat.unread > 0 && (
                    <Badge className="ml-2 bg-gradient-to-r from-purple-500 to-pink-500 border-0 text-xs">
                      {chat.unread}
                    </Badge>
                  )}
                </div>
              </div>

              <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
