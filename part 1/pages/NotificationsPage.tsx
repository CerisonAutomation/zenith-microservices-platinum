/**
 * 🔔 Notifications Page - All Notifications
 */

import { MainLayout } from '@/components/layout/MainLayout';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Heart, MessageCircle, Calendar, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPage() {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useApp();

  const getIcon = (type: string) => {
    switch (type) {
      case 'match':
        return <Heart className="h-5 w-5 text-pink-500" fill="currentColor" />;
      case 'message':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'booking':
        return <Calendar className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
            <p className="text-white/60">Stay updated with your latest activity</p>
          </div>
          {notifications.some((n) => !n.read) && (
            <Button variant="outline" size="sm" onClick={markAllNotificationsAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No notifications</p>
                <p className="text-sm text-muted-foreground">
                  You're all caught up!
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notif) => (
              <Card
                key={notif.id}
                className={`cursor-pointer transition ${
                  !notif.read ? 'border-blue-500/50 bg-blue-500/5' : ''
                }`}
                onClick={() => markNotificationAsRead(notif.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">{getIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{notif.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notif.message}
                          </p>
                        </div>
                        {!notif.read && (
                          <Badge variant="secondary" className="flex-shrink-0">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(notif.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
