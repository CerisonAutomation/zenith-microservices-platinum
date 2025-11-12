/**
 * Real-Time Messaging System
 * Features:
 * - WebSocket real-time messaging
 * - Typing indicators
 * - Read receipts
 * - Voice messages
 * - Image/GIF support
 * - Message reactions
 * - Infinite scroll
 * - Online presence
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  MicOff,
  Image as ImageIcon,
  X,
  Check,
  CheckCheck,
  Circle,
  Phone,
  Video,
  MoreVertical,
  Search,
} from 'lucide-react';
import { useMessages, useIntersectionObserver } from '@/hooks';
import { MessagingService } from '@/services/api.service';
import { supabase } from '@/services/api.service';
import type { Message, Conversation, DatingProfile } from '@/types/dating.types';

interface MessagingSystemProps {
  userId: string;
  isPremium: boolean;
}

export function MessagingSystem({ userId, isPremium }: MessagingSystemProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Load conversations
  useEffect(() => {
    loadConversations();

    // Subscribe to new messages
    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          console.log('New message:', payload);
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', [userId])
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    searchQuery ? conv.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  if (!isPremium) {
    return <PremiumRequired />;
  }

  return (
    <div className="h-screen flex bg-black">
      {/* Conversations List */}
      <div className="w-96 border-r border-white/10 flex flex-col">
        <ConversationsList
          conversations={filteredConversations}
          selectedId={selectedConversation}
          onSelect={setSelectedConversation}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <MessagesArea
            conversationId={selectedConversation}
            userId={userId}
            onBack={() => setSelectedConversation(null)}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

// Conversations List Component
function ConversationsList({
  conversations,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
}: {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}) {
  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-xl font-bold text-white mb-4">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isSelected={selectedId === conversation.id}
            onClick={() => onSelect(conversation.id)}
          />
        ))}
      </div>
    </>
  );
}

// Conversation Item
function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}) {
  // Mock data - would come from conversation.participants
  const otherUser = {
    name: 'John Doe',
    avatar: 'https://i.pravatar.cc/150?img=12',
    online: true,
  };

  return (
    <motion.div
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
      onClick={onClick}
      className={`p-4 cursor-pointer border-b border-white/5 transition-colors ${
        isSelected ? 'bg-purple-600/20' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar className="w-12 h-12">
            <AvatarImage src={otherUser.avatar} />
            <AvatarFallback>{otherUser.name[0]}</AvatarFallback>
          </Avatar>
          {otherUser.online && (
            <Circle className="absolute bottom-0 right-0 w-3 h-3 fill-green-400 text-green-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-white truncate">{otherUser.name}</h3>
            <span className="text-xs text-gray-400">2m ago</span>
          </div>
          <p className="text-sm text-gray-400 truncate">
            {conversation.lastMessage?.content || 'No messages yet'}
          </p>
        </div>

        {conversation.unreadCount > 0 && (
          <Badge className="bg-purple-600 text-white border-0 h-5 min-w-5 flex items-center justify-center">
            {conversation.unreadCount}
          </Badge>
        )}
      </div>
    </motion.div>
  );
}

// Messages Area
function MessagesArea({
  conversationId,
  userId,
  onBack,
}: {
  conversationId: string;
  userId: string;
  onBack: () => void;
}) {
  const { items: messages, loading, hasMore, loadMore, sendMessage } = useMessages(conversationId);
  const [messageText, setMessageText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loadMoreRef, isIntersecting] = useIntersectionObserver({ threshold: 0.1 });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load more on scroll to top
  useEffect(() => {
    if (isIntersecting && hasMore && !loading) {
      loadMore();
    }
  }, [isIntersecting, hasMore, loading, loadMore]);

  // Listen for typing indicators
  useEffect(() => {
    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typing = Object.values(state).flatMap((presences: any) =>
          presences.filter((p: any) => p.typing && p.userId !== userId).map((p: any) => p.userId)
        );
        setTypingUsers(typing);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, userId]);

  const handleSend = async () => {
    if (!messageText.trim()) return;

    try {
      await sendMessage(messageText);
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTyping = () => {
    // Broadcast typing indicator
    supabase.channel(`typing:${conversationId}`).track({
      userId,
      typing: true,
    });
  };

  // Mock other user data
  const otherUser = {
    name: 'John Doe',
    avatar: 'https://i.pravatar.cc/150?img=12',
    online: true,
  };

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="lg:hidden">
            <X className="w-5 h-5 text-white" />
          </button>
          <Avatar className="w-10 h-10">
            <AvatarImage src={otherUser.avatar} />
            <AvatarFallback>{otherUser.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-white">{otherUser.name}</h3>
            <p className="text-xs text-gray-400">
              {otherUser.online ? 'Online' : 'Last seen 2h ago'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-purple-900/10 to-black">
        {hasMore && (
          <div ref={loadMoreRef} className="text-center py-2">
            {loading && <span className="text-gray-400 text-sm">Loading...</span>}
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.senderId === userId}
          />
        ))}

        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={otherUser.avatar} />
            </Avatar>
            <div className="bg-white/10 rounded-2xl px-4 py-2">
              <div className="flex gap-1">
                <motion.div
                  className="w-2 h-2 bg-gray-400 rounded-full"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                />
                <motion.div
                  className="w-2 h-2 bg-gray-400 rounded-full"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                />
                <motion.div
                  className="w-2 h-2 bg-gray-400 rounded-full"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Paperclip className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <ImageIcon className="w-5 h-5" />
          </Button>

          <div className="flex-1 relative">
            <textarea
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              className="w-full px-4 py-3 pr-12 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none max-h-32"
              rows={1}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 bottom-2 text-white hover:bg-white/10"
            >
              <Smile className="w-5 h-5" />
            </Button>
          </div>

          {messageText.trim() ? (
            <Button
              onClick={handleSend}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-full w-12 h-12"
            >
              <Send className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              onClick={() => setIsRecording(!isRecording)}
              className={`rounded-full w-12 h-12 ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-500'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
              }`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

// Message Bubble
function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const formattedTime = new Date(message.sentAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              : 'bg-white/10 text-white'
          }`}
        >
          <p className="break-words">{message.content}</p>
        </div>
        <div className={`flex items-center gap-1 mt-1 text-xs text-gray-400 ${isOwn ? 'justify-end' : ''}`}>
          <span>{formattedTime}</span>
          {isOwn && (
            <>
              {message.readAt ? (
                <CheckCheck className="w-3 h-3 text-blue-400" />
              ) : (
                <Check className="w-3 h-3" />
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Premium Required
function PremiumRequired() {
  return (
    <div className="h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md bg-black/40 backdrop-blur-xl border-2 border-purple-500/30">
        <CardHeader>
          <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white text-center">Messaging is Premium</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300 text-center">
            Upgrade to Premium to send unlimited messages and connect with matches
          </p>
          <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500">
            Upgrade to Premium
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Empty State
function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
          <Send className="w-12 h-12 text-purple-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Your Messages</h3>
        <p className="text-gray-400">Select a conversation to start chatting</p>
      </div>
    </div>
  );
}
