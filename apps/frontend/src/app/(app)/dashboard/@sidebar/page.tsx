import { Suspense } from 'react';
import { Bell, MessageCircle, Heart, Calendar } from 'lucide-react';
import { Card, Badge } from '@zenith/ui-components';
import Link from 'next/link';

export default function SidebarPage() {
  return (
    <div className="p-4 space-y-4">
      {/* Quick Stats */}
      <Card className="p-4">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Heart className="h-4 w-4 text-primary" />
          Quick Stats
        </h2>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">12</div>
            <div className="text-xs text-muted-foreground">New Matches</div>
          </div>
          <div>
            <div className="text-2xl font-bold">5</div>
            <div className="text-xs text-muted-foreground">Messages</div>
          </div>
        </div>
      </Card>

      {/* Recent Messages */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Messages
          </h2>
          <Link href="/messages" className="text-xs text-primary hover:underline">
            View all
          </Link>
        </div>

        <Suspense fallback={<MessagesSkeleton />}>
          <RecentMessages />
        </Suspense>
      </Card>

      {/* Notifications */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
            <Badge variant="destructive" className="ml-1">3</Badge>
          </h2>
          <Link href="/notifications" className="text-xs text-primary hover:underline">
            View all
          </Link>
        </div>

        <Suspense fallback={<NotificationsSkeleton />}>
          <RecentNotifications />
        </Suspense>
      </Card>

      {/* Upcoming Bookings */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming
          </h2>
        </div>

        <div className="text-sm text-muted-foreground text-center py-4">
          No upcoming bookings
        </div>
      </Card>
    </div>
  );
}

async function RecentMessages() {
  // In real app, fetch from API
  const messages = [
    { id: 1, name: 'Sarah', preview: 'Hey! How are you?', time: '2m ago', unread: true },
    { id: 2, name: 'Mike', preview: 'Thanks for the coffee!', time: '1h ago', unread: false },
    { id: 3, name: 'Emma', preview: 'See you tomorrow 😊', time: '3h ago', unread: false },
  ];

  return (
    <div className="space-y-2">
      {messages.map((msg) => (
        <Link
          key={msg.id}
          href={`/messages/${msg.id}`}
          className="block p-2 rounded hover:bg-accent transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs">
              {msg.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${msg.unread ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {msg.name}
                </span>
                <span className="text-xs text-muted-foreground">{msg.time}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{msg.preview}</p>
            </div>
            {msg.unread && (
              <div className="w-2 h-2 bg-primary rounded-full" />
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

async function RecentNotifications() {
  const notifications = [
    { id: 1, type: 'like', text: 'Jessica liked your profile', time: '5m ago' },
    { id: 2, type: 'match', text: 'You matched with Alex!', time: '1h ago' },
    { id: 3, type: 'message', text: 'New message from Sarah', time: '2h ago' },
  ];

  return (
    <div className="space-y-2">
      {notifications.map((notif) => (
        <div key={notif.id} className="p-2 rounded hover:bg-accent transition-colors cursor-pointer">
          <div className="flex items-start gap-2">
            <div className="mt-1">
              {notif.type === 'like' && <Heart className="h-3 w-3 text-pink-500" />}
              {notif.type === 'match' && <Heart className="h-3 w-3 text-primary fill-primary" />}
              {notif.type === 'message' && <MessageCircle className="h-3 w-3 text-blue-500" />}
            </div>
            <div className="flex-1">
              <p className="text-xs">{notif.text}</p>
              <p className="text-xs text-muted-foreground">{notif.time}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-12 bg-muted animate-pulse rounded" />
      ))}
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-10 bg-muted animate-pulse rounded" />
      ))}
    </div>
  );
}
