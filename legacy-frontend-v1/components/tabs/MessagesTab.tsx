/**
 * OMNIPRIME 15 Commandments - Messages Tab
 * Absolute, complete, auto-perfected messaging interface
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MoreVertical, MessageCircle, AlertCircle } from "lucide-react";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import ChatWindow from "../chat/ChatWindow";
import ChatErrorBoundary from "../chat/ChatErrorBoundary";
import { useConversations, useChatActions, useChatUI } from "../../stores/chatStore";

export default function MessagesTab() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Use the comprehensive chat store
  const conversations = useConversations();
  const { isLoading, error, connectionStatus } = useChatUI();
  const { loadConversations, selectConversation, clearError } = useChatActions();

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []); // Remove loadConversations from dependencies to prevent infinite loop

  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    return conversations.filter((conversation: any) =>
      conversation.participants.some((participant: any) =>
        participant.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [conversations, searchQuery]);

  // Handle conversation selection
  const handleSelectConversation = (conversationId: string) => {
    selectConversation(conversationId);
    setSelectedChat(conversationId);
  };

  // Handle back navigation
  const handleBack = () => {
    setSelectedChat(null);
  };

  // Show chat window if conversation is selected
  if (selectedChat) {
    const conversation = conversations.find((c: any) => c.id === selectedChat);
    if (conversation) {
      return (
        <ChatErrorBoundary onError={(error) => console.error('Chat error:', error)}>
          <ChatWindow
            chat={{
              id: conversation.id,
              name: conversation.participants[0]?.name || 'Unknown',
              avatar: conversation.participants[0]?.photo || '',
              online: conversation.isOnline
            }}
            onBack={handleBack}
          />
        </ChatErrorBoundary>
      );
    }
  }

  return (
    <ChatErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 relative overflow-hidden">
        {/* Legendary Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent"></div>

        {/* Connection Status Indicator */}
        {connectionStatus !== 'connected' && (
          <motion.div
            className="bg-gradient-to-r from-amber-500/20 via-amber-600/20 to-amber-500/20 backdrop-blur-xl border-b border-amber-500/30 px-4 py-3 shadow-lg"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="flex items-center gap-2 text-amber-200 text-sm">
              <AlertCircle className="w-4 h-4 animate-pulse" />
              <span className="font-medium">
                {connectionStatus === 'connecting' && 'Connecting to legendary chat...'}
                {connectionStatus === 'disconnected' && 'Chat disconnected'}
                {connectionStatus === 'error' && 'Chat connection error'}
              </span>
            </div>
          </motion.div>
        )}

        {/* Legendary Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-r from-black/60 via-purple-900/40 to-black/60 backdrop-blur-2xl border-b border-amber-500/20 shadow-2xl shadow-purple-500/10 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent"></div>
          <div className="px-4 py-4 relative">
            <motion.h1
              className="text-xl font-bold tracking-wide bg-gradient-to-r from-amber-300 via-amber-200 to-amber-100 bg-clip-text text-transparent mb-3"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Messages
            </motion.h1>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
              <Input
                placeholder="Search legendary conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gradient-to-r from-white/10 via-white/15 to-white/10 backdrop-blur-xl border-amber-500/30 text-white placeholder:text-amber-400/60 h-10 rounded-full px-4 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all duration-300 shadow-lg shadow-purple-500/10"
              />
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <motion.div
            className="bg-gradient-to-r from-red-500/20 via-red-600/20 to-red-500/20 backdrop-blur-xl border-b border-red-500/30 px-4 py-3 shadow-lg"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-200">
                <AlertCircle className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-medium">{error}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearError}
                className="text-red-200 hover:text-red-100 hover:bg-red-500/20 rounded-full transition-all duration-300"
              >
                Dismiss
              </Button>
            </div>
          </motion.div>
        )}

        {/* Legendary Conversations List */}
        <div className="divide-y divide-amber-500/10 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent pointer-events-none"></div>
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, index) => (
              <motion.div
                key={index}
                className="px-4 py-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center gap-4">
                  <Skeleton className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-800/30 to-amber-800/30 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24 bg-gradient-to-r from-purple-800/30 to-amber-800/30 animate-pulse" />
                    <Skeleton className="h-3 w-48 bg-gradient-to-r from-purple-800/30 to-amber-800/30 animate-pulse" />
                  </div>
                </div>
              </motion.div>
            ))
          ) : filteredConversations.length === 0 ? (
            // Empty state
            <motion.div
              className="flex flex-col items-center justify-center py-16 px-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <MessageCircle className="w-16 h-16 text-amber-400/50 mb-4" />
              </motion.div>
              <h3 className="text-amber-200 font-bold text-lg mb-2">
                {searchQuery ? 'No conversations found' : 'No messages yet'}
              </h3>
              <p className="text-amber-300/70 text-sm text-center max-w-sm">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Start a legendary conversation to see your messages here'
                }
              </p>
            </motion.div>
          ) : (
            // Conversations list
            <AnimatePresence>
              {filteredConversations.map((conversation: any, index: number) => (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
                  onClick={() => handleSelectConversation(conversation.id)}
                  className="px-4 py-4 hover:bg-gradient-to-r hover:from-purple-500/10 hover:via-amber-500/5 hover:to-purple-500/10 cursor-pointer transition-all duration-300 group relative"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="relative">
                      <Avatar className="w-14 h-14 border-2 border-amber-500/30 shadow-lg shadow-purple-500/20 group-hover:border-amber-400/50 transition-all duration-300">
                        <AvatarImage src={conversation.participants[0]?.photo} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-amber-500 text-white font-bold">
                          {conversation.participants[0]?.name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.isOnline && (
                        <motion.div
                          className="absolute bottom-0 right-0 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-black shadow-lg"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-white truncate group-hover:text-amber-200 transition-colors duration-300">
                          {conversation.participants[0]?.name || 'Unknown User'}
                        </h3>
                        <span className="text-xs text-amber-400/80 font-medium">
                          {conversation.updatedAt.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-amber-300/70 truncate">
                          {conversation.lastMessage?.content || 'No messages yet'}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                          >
                            <Badge className="ml-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 border-0 text-white text-xs font-bold shadow-lg shadow-amber-500/25 px-2 py-1">
                              {conversation.unreadCount}
                            </Badge>
                          </motion.div>
                        )}
                      </div>
                    </div>

                    <motion.button
                      className="p-2 hover:bg-amber-500/20 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <MoreVertical className="w-5 h-5 text-amber-300" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </ChatErrorBoundary>
  );
}
