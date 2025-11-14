'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface TypingIndicatorProps {
  conversationId: string
  currentUserId: string
  otherUserName?: string
  className?: string
}

export function TypingIndicator({
  conversationId,
  currentUserId,
  otherUserName = 'User',
  className
}: TypingIndicatorProps) {
  const [isTyping, setIsTyping] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to typing events
    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.user_id !== currentUserId) {
          setIsTyping(payload.payload.is_typing)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, currentUserId])

  if (!isTyping) return null

  return (
    <div className={cn('flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400', className)}>
      <span>{otherUserName} is typing</span>
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

// Hook to broadcast typing status
export function useTypingIndicator(conversationId: string, userId: string) {
  const supabase = createClient()
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)

  const broadcastTyping = (isTyping: boolean) => {
    supabase
      .channel(`typing:${conversationId}`)
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: userId, is_typing: isTyping }
      })
  }

  const handleTyping = () => {
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }

    // Broadcast that user is typing
    broadcastTyping(true)

    // Set timeout to stop typing indicator after 3 seconds
    const timeout = setTimeout(() => {
      broadcastTyping(false)
    }, 3000)

    setTypingTimeout(timeout)
  }

  const stopTyping = () => {
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }
    broadcastTyping(false)
  }

  return { handleTyping, stopTyping }
}
