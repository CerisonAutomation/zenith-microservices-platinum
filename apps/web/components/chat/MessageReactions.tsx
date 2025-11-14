'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface MessageReaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
  created_at: string
  user?: {
    username: string
    avatar_url?: string
  }
}

interface MessageReactionsProps {
  messageId: string
  currentUserId: string
  className?: string
}

const EMOJI_OPTIONS = ['❤️', '😂', '👍', '😮', '😢', '😍', '🔥', '💯']

export function MessageReactions({
  messageId,
  currentUserId,
  className
}: MessageReactionsProps) {
  const [reactions, setReactions] = useState<MessageReaction[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Fetch reactions for this message
  useEffect(() => {
    fetchReactions()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`reactions:${messageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `message_id=eq.${messageId}`
        },
        () => {
          fetchReactions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [messageId])

  const fetchReactions = async () => {
    const { data, error } = await supabase
      .from('message_reactions')
      .select(`
        *,
        user:profiles(username, avatar_url)
      `)
      .eq('message_id', messageId)

    if (!error && data) {
      setReactions(data)
    }
  }

  const addReaction = async (emoji: string) => {
    setLoading(true)
    setShowPicker(false)

    // Check if user already reacted with this emoji
    const existing = reactions.find(
      r => r.user_id === currentUserId && r.emoji === emoji
    )

    if (existing) {
      // Remove reaction
      await supabase
        .from('message_reactions')
        .delete()
        .eq('id', existing.id)
    } else {
      // Add reaction
      await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: currentUserId,
          emoji
        })
    }

    setLoading(false)
  }

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = []
    }
    acc[reaction.emoji].push(reaction)
    return acc
  }, {} as Record<string, MessageReaction[]>)

  return (
    <div className={cn('relative', className)}>
      {/* Display existing reactions */}
      <div className="flex flex-wrap gap-1 items-center">
        {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
          const userReacted = reactionList.some(r => r.user_id === currentUserId)

          return (
            <button
              key={emoji}
              onClick={() => addReaction(emoji)}
              disabled={loading}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm',
                'transition-all hover:scale-110',
                'border border-gray-200 dark:border-gray-700',
                userReacted
                  ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600'
                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
              title={reactionList.map(r => r.user?.username || 'User').join(', ')}
            >
              <span className="text-base">{emoji}</span>
              <span className={cn(
                'text-xs font-medium',
                userReacted ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'
              )}>
                {reactionList.length}
              </span>
            </button>
          )
        })}

        {/* Add reaction button */}
        <button
          onClick={() => setShowPicker(!showPicker)}
          disabled={loading}
          className={cn(
            'inline-flex items-center justify-center',
            'w-8 h-8 rounded-full',
            'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
            'hover:bg-gray-100 dark:hover:bg-gray-700',
            'transition-all hover:scale-110'
          )}
          aria-label="Add reaction"
        >
          {showPicker ? '✕' : '😊'}
        </button>
      </div>

      {/* Emoji picker dropdown */}
      {showPicker && (
        <div className="absolute bottom-full mb-2 left-0 z-10">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2">
            <div className="grid grid-cols-4 gap-1">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => addReaction(emoji)}
                  disabled={loading}
                  className={cn(
                    'w-10 h-10 rounded hover:bg-gray-100 dark:hover:bg-gray-700',
                    'transition-all hover:scale-125 text-2xl'
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
