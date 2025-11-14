import { useState } from "react";
import { ArrowLeft, Send, Image, Mic, Smile, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Input, Button } from "@zenith/ui-components";
import { motion } from "framer-motion";

interface Chat {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
}

interface ChatWindowProps {
  chat: Chat;
  onBack: () => void;
}

const mockMessages = [
  { id: "1", text: "Hey! How are you?", sent: false, timestamp: "10:30 AM" },
  { id: "2", text: "I'm good! How about you?", sent: true, timestamp: "10:32 AM" },
  { id: "3", text: "Doing great! Want to grab coffee sometime?", sent: false, timestamp: "10:35 AM" },
  { id: "4", text: "That sounds perfect! When are you free?", sent: true, timestamp: "10:36 AM" },
];

export default function ChatWindow({ chat, onBack }: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const [messages] = useState(mockMessages);

  const handleSend = () => {
    if (message.trim()) {
      // Handle send message
      setMessage("");
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <Avatar className="w-10 h-10 border-2 border-white/10">
                <AvatarImage src={chat.avatar} />
                <AvatarFallback>{chat.name[0]}</AvatarFallback>
              </Avatar>
              {chat.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-white">{chat.name}</h2>
              <p className="text-xs text-gray-400">{chat.online ? "Online" : "Offline"}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-white/10"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg, index) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex ${msg.sent ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                msg.sent
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "bg-white/10 backdrop-blur-sm text-white"
              }`}
            >
              <p className="text-sm">{msg.text}</p>
              <p className={`text-xs mt-1 ${msg.sent ? "text-white/70" : "text-gray-400"}`}>
                {msg.timestamp}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-black/40 backdrop-blur-xl border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-white/10 shrink-0"
          >
            <Image className="w-5 h-5" />
          </Button>

          <div className="flex-1 relative">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pr-10"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full hover:bg-white/10"
            >
              <Smile className="w-5 h-5" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-white/10 shrink-0"
          >
            <Mic className="w-5 h-5" />
          </Button>

          <Button
            onClick={handleSend}
            size="icon"
            className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
