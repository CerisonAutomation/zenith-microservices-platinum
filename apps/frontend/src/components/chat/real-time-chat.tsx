'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, MoreVertical, Phone, Video } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  content: string
  sender_id: string
  receiver_id: string
  created_at: string
  message_type: 'text' | 'image' | 'system'
  read: boolean
  read_at?: string
  is_delivered?: boolean
  delivered_at?: string
  attachment_url?: string
  attachment_metadata?: any
  // Optimistic UI fields
  isOptimistic?: boolean
  sendError?: string
}

interface ChatUser {
  id: string
  username: string
  full_name: string
  avatar_url?: string
  is_online: boolean
}

interface RealTimeChatProps {
  chatId: string
  currentUserId: string
  otherUser: ChatUser
  matchId?: string // Add matchId for proper message association
}

export function RealTimeChat({ chatId, currentUserId, otherUser }: RealTimeChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load initial messages
    const loadMessages = async () => {
      const { data, error } = await (supabase as any)
        .from('messages')
        .select('*')
        .eq('match_id', chatId)
        .order('created_at', { ascending: true })

      if (data && !error) {
        setMessages(data)
      }
    }

    loadMessages()

    // Subscribe to new messages
    const subscription = (supabase as any)
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${chatId}`
        },
        (payload: any) => {
          setMessages(prev => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [chatId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    // Mark messages as read when chat is viewed
    const markMessagesAsRead = async () => {
      const unreadMessages = messages.filter(msg => 
        msg.sender_id !== currentUserId && !msg.read
      )
      
      if (unreadMessages.length > 0) {
        const { error } = await (supabase as any)
          .from('messages')
          .update({ 
            is_read: true, 
            read_at: new Date().toISOString() 
          })
          .in('id', unreadMessages.map(msg => msg.id))
        
        if (!error) {
          setMessages(prev => prev.map(msg => 
            unreadMessages.some(unread => unread.id === msg.id)
              ? { ...msg, read: true, read_at: new Date().toISOString() }
              : msg
          ))
        }
      }
    }

    if (messages.length > 0) {
      markMessagesAsRead()
    }
  }, [messages, currentUserId])

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    const tempId = `temp-${Date.now()}`
    const optimisticMessage: Message = {
      id: tempId,
      content: newMessage.trim(),
      sender_id: currentUserId,
      receiver_id: otherUser.id,
      created_at: new Date().toISOString(),
      message_type: 'text',
      read: false,
      isOptimistic: true
    }

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage])
    setNewMessage('')

    try {
      const { data, error } = await (supabase as any)
        .from('messages')
        .insert({
          match_id: chatId, // Using chatId as match_id for now
          sender_id: currentUserId,
          receiver_id: otherUser.id,
          content: newMessage.trim(),
          message_type: 'text'
        })
        .select()
        .single()

      if (error) throw error

      // Replace optimistic message with real one
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...data, isOptimistic: false } : msg
      ))
    } catch (error) {
      console.error('Failed to send message:', error)
      // Mark message as failed
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, sendError: 'Failed to send' } : msg
      ))
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={otherUser.avatar_url || `https://ui-avatars.com/api/?name=${otherUser.full_name}&background=f59e0b&color=fff`}
              alt={otherUser.full_name}
              className="w-10 h-10 rounded-full object-cover"
            />
            {otherUser.is_online && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {otherUser.full_name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {otherUser.is_online ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <Phone className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <Video className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${
                message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.sender_id === currentUserId
                    ? 'bg-amber-600 text-white rounded-br-none'
                    : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-none'
                } ${message.isOptimistic ? 'opacity-70' : ''}`}
              >
                <p className="text-sm">{message.content}</p>
                <div className={`text-xs mt-1 flex items-center gap-1 ${
                  message.sender_id === currentUserId
                    ? 'text-amber-100'
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                  <span>{formatTime(message.created_at)}</span>
                  {message.sender_id === currentUserId && (
                    <span>
                      {message.isOptimistic ? '⏳' : message.read ? '✓✓' : '✓'}
                    </span>
                  )}
                  {message.sendError && (
                    <span className="text-red-400">❌ {message.sendError}</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white dark:bg-slate-700 px-4 py-2 rounded-2xl rounded-bl-none">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-full focus:outline-none focus:border-amber-500 dark:bg-slate-700 dark:text-white"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-400 text-white rounded-full transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}