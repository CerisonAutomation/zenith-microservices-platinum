/**
 * 🔔 Notifications Page - Activity Feed
 * Next.js 14 App Router page
 */

'use client'

import { useState, useEffect } from 'react'
import { Bell, Heart, MessageCircle, Calendar, UserPlus, Star, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/utils/supabase/client'

interface Notification {
  id: string
  type: 'match' | 'message' | 'like' | 'booking' | 'system'
  title: string
  message: string
  timestamp: string
  read: boolean
  from_user?: {
    name: string
    avatar_url?: string
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          from_user:profiles!notifications_from_user_id_fkey(name, avatar_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && data) {
        setNotifications(data)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)

    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)

    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length
  const unreadNotifications = notifications.filter(n => !n.read)
  const allNotifications = notifications

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-amber-900/20 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-amber-50">Notifications</h1>
            <p className="text-amber-200/80 mt-2">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              Mark all as read
            </Button>
          )}
        </div>

        <Tabs defaultValue="unread" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
            <TabsTrigger value="unread">
              Unread ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({allNotifications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unread" className="space-y-3 mt-6">
            {unreadNotifications.length === 0 ? (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="pt-6 text-center text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No unread notifications</p>
                </CardContent>
              </Card>
            ) : (
              unreadNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-3 mt-6">
            {allNotifications.length === 0 ? (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="pt-6 text-center text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications yet</p>
                </CardContent>
              </Card>
            ) : (
              allNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function NotificationCard({
  notification,
  onMarkAsRead
}: {
  notification: Notification
  onMarkAsRead: (id: string) => void
}) {
  const getIcon = () => {
    switch (notification.type) {
      case 'match':
        return <Heart className="w-5 h-5 text-pink-400" />
      case 'message':
        return <MessageCircle className="w-5 h-5 text-blue-400" />
      case 'like':
        return <Star className="w-5 h-5 text-amber-400" />
      case 'booking':
        return <Calendar className="w-5 h-5 text-green-400" />
      default:
        return <Bell className="w-5 h-5 text-gray-400" />
    }
  }

  return (
    <Card
      className={`cursor-pointer transition-all ${
        notification.read
          ? 'bg-gray-800/30 border-gray-700/50'
          : 'bg-gray-800/50 border-amber-500/30 hover:border-amber-500/50'
      }`}
      onClick={() => !notification.read && onMarkAsRead(notification.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{getIcon()}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-semibold text-amber-50 text-sm">
                  {notification.title}
                </h3>
                <p className="text-sm text-amber-100/70 mt-1">
                  {notification.message}
                </p>
                <p className="text-xs text-amber-200/50 mt-2">
                  {new Date(notification.timestamp).toLocaleString()}
                </p>
              </div>
              {!notification.read && (
                <Badge variant="default" className="bg-amber-500 text-xs shrink-0">
                  New
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
