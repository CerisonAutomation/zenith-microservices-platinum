import { useState } from "react";
import { ArrowLeft, Send, Image, Mic, Smile, MoreVertical, Check, CheckCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { motion } from "framer-motion";
import { useChatActions, useMessages, useOptimisticMessages, useActiveConversation } from "../../stores/chatStore";

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

export default function ChatWindow({ chat, onBack }: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const { sendMessage } = useChatActions();
  const activeConversation = useActiveConversation();
  const messages = useMessages(activeConversation || '');
  const optimisticMessages = useOptimisticMessages(activeConversation || '');

  // Combine real and optimistic messages
  const allMessages = [...messages, ...optimisticMessages].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  const handleSend = async () => {
    if (message.trim() && activeConversation) {
      await sendMessage(activeConversation, message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 relative overflow-hidden">
      {/* Legendary Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent"></div>

      {/* Animated Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>
      {/* Legendary Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-black/60 via-purple-900/40 to-black/60 backdrop-blur-2xl border-b border-amber-500/20 shadow-2xl shadow-purple-500/10 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent"></div>
        <div className="px-4 py-4 flex items-center gap-4 relative">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="rounded-full hover:bg-amber-500/20 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300 border border-white/10"
            >
              <ArrowLeft className="w-5 h-5 text-amber-300" />
            </Button>
          </motion.div>

          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <Avatar className="w-10 h-10 border-2 border-amber-500/30 shadow-lg shadow-purple-500/20">
                <AvatarImage src={chat.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-amber-500 text-white font-bold">
                  {chat.name[0]}
                </AvatarFallback>
              </Avatar>
              {chat.online && (
                <motion.div
                  className="absolute bottom-0 right-0 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-black shadow-lg"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>
            <div>
              <h2 className="font-bold text-white text-lg bg-gradient-to-r from-amber-300 via-amber-200 to-amber-100 bg-clip-text text-transparent">
                {chat.name}
              </h2>
              <p className="text-xs text-amber-400/80 font-medium">
                {chat.online ? "● Online" : "○ Offline"}
              </p>
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-purple-500/20 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 border border-white/10"
            >
              <MoreVertical className="w-5 h-5 text-purple-300" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Legendary Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent pointer-events-none"></div>
        {allMessages.map((msg, index) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: index * 0.05,
              type: "spring",
              stiffness: 100,
              damping: 15
            }}
            className={`flex ${msg.senderId === 'current-user-id' ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-xl relative group ${
                msg.senderId === 'current-user-id'
                  ? "bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white shadow-purple-500/25"
                  : "bg-gradient-to-r from-white/15 via-white/10 to-white/15 backdrop-blur-xl text-white border border-white/20 shadow-amber-500/10"
              } ${msg.isOptimistic ? 'opacity-70 animate-pulse' : ''}`}
            >
              {/* Message Glow Effect */}
              <div className={`absolute inset-0 rounded-2xl blur-sm opacity-50 ${
                msg.senderId === 'current-user-id'
                  ? "bg-gradient-to-r from-purple-500 to-pink-500"
                  : "bg-gradient-to-r from-amber-500/20 to-purple-500/20"
              }`}></div>

              <div className="relative z-10">
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <div className={`flex items-center justify-between mt-2 ${
                  msg.senderId === 'current-user-id' ? "text-white/80" : "text-amber-400/80"
                }`}>
                  <span className="text-xs font-medium">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.senderId === 'current-user-id' && !msg.isOptimistic && (
                    <motion.div
                      className="flex items-center ml-2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {msg.read ? (
                        <CheckCheck className="w-3 h-3 text-blue-300" />
                      ) : (
                        <Check className="w-3 h-3 text-white/60" />
                      )}
                    </motion.div>
                  )}
                  {msg.sendError && (
                    <motion.span
                      className="text-xs text-red-400 ml-2 font-medium"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      Failed to send
                    </motion.span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Legendary Input Area */}
      <div className="sticky bottom-0 bg-gradient-to-r from-black/60 via-purple-900/40 to-black/60 backdrop-blur-2xl border-t border-amber-500/20 px-4 py-4 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent"></div>
        <div className="flex items-center gap-3 relative">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-purple-500/20 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 border border-white/10"
            >
              <Image className="w-5 h-5 text-purple-300" />
            </Button>
          </motion.div>

          <div className="flex-1 relative">
            <Input
              placeholder="Type a legendary message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="bg-gradient-to-r from-white/10 via-white/15 to-white/10 backdrop-blur-xl border-amber-500/30 text-white placeholder:text-amber-400/60 pr-12 rounded-full h-12 px-4 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all duration-300 shadow-lg shadow-purple-500/10"
            />
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full hover:bg-amber-500/20 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300"
              >
                <Smile className="w-5 h-5 text-amber-300" />
              </Button>
            </motion.div>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 border border-white/10"
            >
              <Mic className="w-5 h-5 text-emerald-300" />
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleSend}
              size="icon"
              disabled={!message.trim()}
              className="rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-600 hover:via-amber-700 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 h-12 w-12"
            >
              <Send className="w-5 h-5 text-white" />
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
