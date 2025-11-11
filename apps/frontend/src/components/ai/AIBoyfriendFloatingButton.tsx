/**
 * 💬 AI BOYFRIEND FLOATING BUTTON
 * Always-accessible floating action button to open AI companion chat
 */

'use client';

import { MessageCircleHeart, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIBoyfriend } from '@/contexts/AIBoyfriendContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export default function AIBoyfriendFloatingButton() {
  const { isChatOpen, toggleChat } = useAIBoyfriend();

  return (
    <AnimatePresence>
      {!isChatOpen && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="fixed bottom-24 right-4 z-40 sm:bottom-6"
        >
          <Button
            onClick={toggleChat}
            size="lg"
            className="relative h-16 w-16 rounded-full bg-gradient-to-br from-pink-500 via-purple-600 to-pink-600 hover:from-pink-600 hover:via-purple-700 hover:to-pink-700 shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 group"
          >
            <MessageCircleHeart className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />

            {/* Notification badge */}
            <Badge className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center border-2 border-gray-900 animate-pulse">
              1
            </Badge>

            {/* Pulsing ring effect */}
            <div className="absolute inset-0 rounded-full bg-pink-500/20 animate-ping"></div>
          </Button>

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute right-20 top-1/2 -translate-y-1/2 bg-purple-900/95 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg whitespace-nowrap"
          >
            <p className="text-sm font-medium">Chat with Zenith AI 💖</p>
            <p className="text-xs text-gray-300">Get dating advice & support!</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
