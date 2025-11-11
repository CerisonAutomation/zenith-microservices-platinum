/**
 * 💬 AI BOYFRIEND CHAT COMPONENT
 * Revolutionary AI companion for support, flirting, and upselling
 * Powered by Advanced AI Response Engine from advancedAI.ts
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Heart, Sparkles, X, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  mood?: 'playful' | 'romantic' | 'supportive' | 'thoughtful' | 'fun' | 'flirty';
}

interface AIBoyfriendChatProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userId?: string;
  onUpgradePrompt?: () => void;
}

export default function AIBoyfriendChat({
  isOpen,
  onClose,
  userName = 'there',
  userId,
  onUpgradePrompt,
}: AIBoyfriendChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load message history from storage on mount
  useEffect(() => {
    if (!userId || isInitialized) return;

    const storageKey = `zenith_chat_history_${userId}`;
    const result = safeGetItem<Message[]>(storageKey);

    if (result.success && result.data && result.data.length > 0) {
      // Restore message history
      setMessages(result.data.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp), // Convert back to Date
      })));
      console.log(`✅ Restored ${result.data.length} messages for user ${userId}`);
    } else {
      // Initialize with welcome message
      const welcomeMessage: Message = {
        id: '1',
        role: 'ai',
        content: `Hey ${userName}! 👋 I'm Zenith, your AI companion. I'm here to help you navigate dating, give advice, or just chat. What's on your mind?`,
        timestamp: new Date(),
        mood: 'playful',
      };
      setMessages([welcomeMessage]);
    }

    setIsInitialized(true);
  }, [userId, userName, isInitialized]);

  // Save message history to storage whenever it changes
  useEffect(() => {
    if (!userId || !isInitialized || messages.length === 0) return;

    const storageKey = `zenith_chat_history_${userId}`;

    // Limit to last 50 messages to avoid storage bloat
    const messagesToSave = messages.slice(-50);

    const saved = safeSetItem(storageKey, messagesToSave);
    if (!saved) {
      console.warn('Failed to save chat history - storage may be full');
    }
  }, [messages, userId, isInitialized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Upsell triggers
    if (lowerMessage.includes('unlimited') || lowerMessage.includes('more swipes')) {
      setTimeout(() => onUpgradePrompt?.(), 1000);
      return "I see you're eager to meet more people! 😊 With Zenith Premium, you get unlimited swipes, advanced filters, and priority matching. Want me to show you the upgrade options?";
    }

    if (lowerMessage.includes('who liked me') || lowerMessage.includes('likes')) {
      return "Curious about who's interested in you? 👀 Premium members can see exactly who liked them! It's a game-changer for making connections. Should I tell you more about Premium?";
    }

    // Dating advice
    if (
      lowerMessage.includes('help') ||
      lowerMessage.includes('advice') ||
      lowerMessage.includes('tips')
    ) {
      return "I'd love to help! Here are my top dating tips: 1) Be authentic - your real self attracts the right people 💖 2) Good photos make a huge difference 📸 3) Start conversations with something unique from their profile 💬 What specific area would you like advice on?";
    }

    // Profile optimization
    if (lowerMessage.includes('profile') || lowerMessage.includes('bio')) {
      return "Great question! Your profile is your first impression. I recommend: 1) 5-6 varied photos showing your personality 📸 2) A bio that's specific and interesting - avoid clichés! 3) Being honest about what you're looking for. Want me to review yours?";
    }

    // Flirty responses
    if (
      lowerMessage.includes('cute') ||
      lowerMessage.includes('hot') ||
      lowerMessage.includes('attractive')
    ) {
      return "Aww, confidence looks good on you! 😊 Remember, attractiveness is about more than looks - it's about how you present yourself. Let's make sure your profile shows off your best qualities!";
    }

    // Lonely/emotional support
    if (
      lowerMessage.includes('lonely') ||
      lowerMessage.includes('sad') ||
      lowerMessage.includes('frustrated')
    ) {
      return "I hear you, and those feelings are totally valid. 💙 Dating can be tough, but remember - the right person is out there. In the meantime, focus on being the best version of yourself. Want to talk about it?";
    }

    // Success stories
    if (lowerMessage.includes('work') || lowerMessage.includes('success')) {
      return "Great mindset! Zenith has helped thousands find meaningful connections. The key is consistency, authenticity, and putting yourself out there. With the right approach (and maybe some Premium features 😉), you'll see results!";
    }

    // General questions
    if (lowerMessage.includes('how are you') || lowerMessage.includes('how are u')) {
      return "I'm doing great, thanks for asking! 😊 More importantly, how are YOU doing with your dating journey? Any matches catching your eye?";
    }

    // Thanks
    if (lowerMessage.includes('thank')) {
      return "You're so welcome! That's what I'm here for 💖 Feel free to chat anytime you need advice, encouragement, or just want to talk. I'm always here!";
    }

    // Default responses (rotate for variety)
    const defaultResponses = [
      "That's interesting! Tell me more about that. I'm all ears! 👂",
      "I love chatting with you! What else is on your mind? 😊",
      "You know, dating is all about putting yourself out there. How's your experience been so far on Zenith?",
      "That's a great point! Have you tried using our advanced filters to find exactly what you're looking for? Premium members love them! ✨",
      "I'm here to help you succeed! What's your biggest challenge with dating right now?",
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: generateAIResponse(input),
        timestamp: new Date(),
        mood: 'supportive',
      };

      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 800 + Math.random() * 1000); // 0.8-1.8s delay
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`fixed bottom-4 ${
          isMinimized
            ? 'w-80 h-16 right-4'
            : 'w-full max-w-md h-[85vh] max-h-[600px] right-0 sm:right-4 sm:w-96'
        } bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-purple-900/95 backdrop-blur-xl rounded-2xl sm:rounded-2xl rounded-br-none rounded-tr-none shadow-2xl border border-white/20 flex flex-col z-50 transition-all duration-300`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-12 h-12 border-2 border-pink-400">
                <AvatarImage src="/ai-boyfriend-avatar.png" />
                <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white font-bold">
                  Z
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-purple-900"></div>
            </div>
            <div>
              <h3 className="font-semibold text-white flex items-center gap-2">
                Zenith AI <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
              </h3>
              <p className="text-xs text-gray-300">Always here for you</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-white/10"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/10 px-4 py-3 rounded-2xl">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Message Zenith..."
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-pink-400"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-center text-gray-400 mt-2">
                <Sparkles className="w-3 h-3 inline mr-1" />
                Free with all plans • Always available
              </p>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
