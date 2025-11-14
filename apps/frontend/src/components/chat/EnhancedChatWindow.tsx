'use client'

/**
 * Enhanced Chat Window with all new features integrated
 * - Emoji reactions
 * - Voice messages
 * - Typing indicators
 * - Video/audio calling
 */

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { MessageReactions } from './MessageReactions'
import { VoiceRecorder } from './VoiceRecorder'
import { TypingIndicator, useTypingIndicator } from './TypingIndicator'
import { Send, Phone, Video, Paperclip, Smile } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: {
    username: string
    avatar_url?: string
  }
}

interface EnhancedChatWindowProps {
  conversationId: string
  currentUserId: string
  otherUserId: string
  otherUserName: string
  className?: string
}

export function EnhancedChatWindow({
  conversationId,
  currentUserId,
  otherUserId,
  otherUserName,
  className
}: EnhancedChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const { handleTyping, stopTyping } = useTypingIndicator(conversationId, currentUserId)

  // Load messages
  useEffect(() => {
    fetchMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
          scrollToBottom()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles(username, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setMessages(data)
      scrollToBottom()
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    stopTyping()

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: newMessage.trim()
        })

      if (!error) {
        setNewMessage('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleVoiceMessageComplete = async (audioUrl: string, duration: number) => {
    try {
      // Create message
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: '[Voice Message]'
        })
        .select()
        .single()

      if (messageError) throw messageError

      // Create voice message entry
      await supabase
        .from('voice_messages')
        .insert({
          message_id: message.id,
          audio_url: audioUrl,
          duration_seconds: duration
        })

      setShowVoiceRecorder(false)
    } catch (error) {
      console.error('Error sending voice message:', error)
    }
  }

  const initiateCall = async (type: 'video' | 'audio') => {
    try {
      const response = await fetch('/api/calls/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_id: otherUserId,
          conversation_id: conversationId,
          type
        })
      })

      if (response.ok) {
        const { room_url } = await response.json()
        // Open call in new window or modal
        window.open(`/call?room=${encodeURIComponent(room_url)}`, '_blank')
      }
    } catch (error) {
      console.error('Error initiating call:', error)
    }
  }

  return (
    <div className={cn('flex flex-col h-full bg-white dark:bg-gray-900', className)}>
      {/* Header with call buttons */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            {otherUserName[0].toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold dark:text-white">{otherUserName}</h3>
            <TypingIndicator
              conversationId={conversationId}
              currentUserId={currentUserId}
              otherUserName={otherUserName}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => initiateCall('audio')}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Voice call"
          >
            <Phone className="w-5 h-5 dark:text-gray-300" />
          </button>
          <button
            onClick={() => initiateCall('video')}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Video call"
          >
            <Video className="w-5 h-5 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwn = message.sender_id === currentUserId

          return (
            <div
              key={message.id}
              className={cn(
                'flex gap-2',
                isOwn ? 'justify-end' : 'justify-start'
              )}
            >
              <div className={cn(
                'max-w-[70%] space-y-1',
                isOwn && 'order-2'
              )}>
                <div
                  className={cn(
                    'px-4 py-2 rounded-2xl',
                    isOwn
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-100 dark:bg-gray-800 dark:text-white rounded-bl-none'
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                </div>

                {/* Emoji reactions */}
                <MessageReactions
                  messageId={message.id}
                  currentUserId={currentUserId}
                />
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t dark:border-gray-700">
        {showVoiceRecorder ? (
          <div className="flex items-center gap-2">
            <VoiceRecorder onRecordingComplete={handleVoiceMessageComplete} />
            <button
              onClick={() => setShowVoiceRecorder(false)}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVoiceRecorder(true)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Record voice message"
            >
              <Paperclip className="w-5 h-5 dark:text-gray-300" />
            </button>

            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value)
                handleTyping()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              onBlur={stopTyping}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className={cn(
                'p-2 rounded-full transition',
                newMessage.trim() && !sending
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
              )}
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
