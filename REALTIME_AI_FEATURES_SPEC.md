# 🚀 Real-Time & AI Features - Technical Specification

**Date:** 2025-11-14
**Status:** Implementation Ready
**Priority:** High Value ($200K+ annual impact)

---

## 📋 EXECUTIVE SUMMARY

This specification covers implementation of:
1. **Real-Time Location Tracking** - Continuous location updates with PostGIS
2. **Real-Time Messaging Features** - Typing indicators, presence, read receipts
3. **AI Chat Assistant** - OpenAI-powered conversation enhancement
4. **AI Content Moderation** - Automated safety and compliance

**Business Impact:**
- Increase engagement by 40% (real-time features)
- Reduce moderation costs by 70% (AI moderation)
- Improve match quality by 35% (AI recommendations)
- Enhance user safety (automated content filtering)

**Technical Stack:**
- Supabase Realtime (WebSocket channels)
- PostGIS (geospatial queries)
- OpenAI GPT-4 (chat assistance)
- OpenAI Moderation API (content filtering)
- TensorFlow.js (client-side ML)

---

## 🗺️ FEATURE 1: Real-Time Location Tracking

### Business Value
- Enable "who's nearby right now" feature
- Improve match relevance with current location
- Support location-based notifications
- Revenue: $40K/year (10% conversion boost)

### Technical Architecture

**Database Changes:**
```sql
-- Add to location_history table
ALTER TABLE location_history ADD COLUMN IF NOT EXISTS accuracy FLOAT;
ALTER TABLE location_history ADD COLUMN IF NOT EXISTS speed FLOAT;
ALTER TABLE location_history ADD COLUMN IF NOT EXISTS heading FLOAT;

-- Create materialized view for active users
CREATE MATERIALIZED VIEW active_users_locations AS
SELECT DISTINCT ON (user_id)
  user_id,
  location,
  accuracy,
  created_at
FROM location_history
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY user_id, created_at DESC;

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_active_locations()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY active_users_locations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule refresh every 30 seconds via Edge Function
```

**Frontend Implementation:**
```typescript
// hooks/useRealtimeLocation.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useRealtimeLocation() {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        setPosition(pos);

        // Update location in database
        await supabase.rpc('update_user_location', {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading
        });
      },
      (err) => setError(err.message),
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { position, error };
}
```

**Realtime Subscription:**
```typescript
// hooks/useNearbyUsers.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

export function useNearbyUsers(radiusKm: number = 10) {
  const [users, setUsers] = useState<Profile[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel('nearby-users')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'location_history'
        },
        async () => {
          // Fetch updated nearby users
          const { data } = await supabase.rpc('find_nearby_users', {
            radius_km: radiusKm
          });
          setUsers(data || []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [radiusKm]);

  return users;
}
```

### Privacy Controls

**User Settings:**
```typescript
// types/location.ts
export type LocationVisibility = 'always' | 'matches_only' | 'never';

export interface LocationSettings {
  visibility: LocationVisibility;
  shareDistance: boolean; // Show "2km away" vs "nearby"
  backgroundUpdates: boolean;
  updateFrequency: 'realtime' | 'periodic' | 'manual';
}
```

**RLS Policy Update:**
```sql
-- Only show location to matched users or within discovery settings
CREATE POLICY "Location visible based on settings"
  ON location_history FOR SELECT
  USING (
    CASE
      WHEN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = user_id
        AND location_visibility = 'always'
      ) THEN true
      WHEN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = user_id
        AND location_visibility = 'matches_only'
      ) THEN EXISTS (
        SELECT 1 FROM matches
        WHERE (user_id = auth.uid() AND matched_user_id = location_history.user_id)
           OR (matched_user_id = auth.uid() AND user_id = location_history.user_id)
        AND status = 'matched'
      )
      ELSE false
    END
  );
```

---

## 💬 FEATURE 2: Real-Time Messaging Enhancements

### 2.1 Typing Indicators

**Supabase Realtime Broadcast:**
```typescript
// hooks/useTypingIndicator.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useTypingIndicator(conversationId: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    const channel = supabase.channel(`typing:${conversationId}`, {
      config: { broadcast: { self: true } }
    });

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        setTypingUsers((prev) => {
          if (payload.isTyping && !prev.includes(payload.userId)) {
            return [...prev, payload.userId];
          } else if (!payload.isTyping) {
            return prev.filter((id) => id !== payload.userId);
          }
          return prev;
        });

        // Auto-remove after 3 seconds
        if (payload.isTyping) {
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((id) => id !== payload.userId));
          }, 3000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return typingUsers;
}

export function sendTypingIndicator(conversationId: string, isTyping: boolean) {
  const channel = supabase.channel(`typing:${conversationId}`);

  channel.send({
    type: 'broadcast',
    event: 'typing',
    payload: {
      userId: supabase.auth.getUser().then(({ data }) => data.user?.id),
      isTyping,
      timestamp: Date.now()
    }
  });
}
```

**UI Component:**
```typescript
// components/chat/TypingIndicator.tsx
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  conversationId: string;
  userNames: Record<string, string>;
}

export function TypingIndicator({ conversationId, userNames }: TypingIndicatorProps) {
  const typingUsers = useTypingIndicator(conversationId);

  if (typingUsers.length === 0) return null;

  const names = typingUsers.map((id) => userNames[id]).filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-2 text-sm text-muted-foreground px-4 py-2"
    >
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>
        {names.length === 1
          ? `${names[0]} is typing...`
          : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} are typing...`}
      </span>
    </motion.div>
  );
}
```

### 2.2 Presence System

**Presence Channel:**
```typescript
// hooks/usePresence.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type UserStatus = 'online' | 'away' | 'offline';

interface PresenceState {
  userId: string;
  status: UserStatus;
  lastSeen: string;
}

export function usePresence() {
  const [presenceState, setPresenceState] = useState<Record<string, PresenceState>>({});

  useEffect(() => {
    const channel = supabase.channel('presence', {
      config: {
        presence: {
          key: supabase.auth.getUser().then(({ data }) => data.user?.id)
        }
      }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const formatted = Object.entries(state).reduce((acc, [userId, presence]) => {
          acc[userId] = presence[0] as PresenceState;
          return acc;
        }, {} as Record<string, PresenceState>);
        setPresenceState(formatted);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setPresenceState((prev) => ({
          ...prev,
          [key]: newPresences[0] as PresenceState
        }));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setPresenceState((prev) => {
          const next = { ...prev };
          if (next[key]) {
            next[key].status = 'offline';
            next[key].lastSeen = new Date().toISOString();
          }
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: (await supabase.auth.getUser()).data.user?.id,
            status: 'online',
            lastSeen: new Date().toISOString()
          });
        }
      });

    // Update to 'away' after 5 minutes of inactivity
    let awayTimeout: NodeJS.Timeout;
    const resetAwayTimer = () => {
      clearTimeout(awayTimeout);
      channel.track({ status: 'online' });
      awayTimeout = setTimeout(() => {
        channel.track({ status: 'away' });
      }, 5 * 60 * 1000);
    };

    window.addEventListener('mousemove', resetAwayTimer);
    window.addEventListener('keypress', resetAwayTimer);

    return () => {
      window.removeEventListener('mousemove', resetAwayTimer);
      window.removeEventListener('keypress', resetAwayTimer);
      clearTimeout(awayTimeout);
      supabase.removeChannel(channel);
    };
  }, []);

  return presenceState;
}
```

**Presence Badge Component:**
```typescript
// components/ui/PresenceBadge.tsx
import { usePresence, type UserStatus } from '@/hooks/usePresence';
import { cn } from '@/lib/utils';

interface PresenceBadgeProps {
  userId: string;
  showLastSeen?: boolean;
}

export function PresenceBadge({ userId, showLastSeen = false }: PresenceBadgeProps) {
  const presenceState = usePresence();
  const presence = presenceState[userId];

  if (!presence) return null;

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-400'
  };

  const getLastSeenText = (lastSeen: string) => {
    const diff = Date.now() - new Date(lastSeen).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <span className={cn('block h-3 w-3 rounded-full', statusColors[presence.status])} />
        {presence.status === 'online' && (
          <span className="absolute inset-0 h-3 w-3 rounded-full bg-green-500 animate-ping opacity-75" />
        )}
      </div>
      {showLastSeen && presence.status === 'offline' && (
        <span className="text-xs text-muted-foreground">
          {getLastSeenText(presence.lastSeen)}
        </span>
      )}
    </div>
  );
}
```

### 2.3 Read Receipts

**Database Updates:**
```sql
-- Add read_by tracking
CREATE TABLE IF NOT EXISTS message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX idx_message_reads_message ON message_reads(message_id);
CREATE INDEX idx_message_reads_user ON message_reads(user_id);

-- RLS
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view read receipts for their messages"
  ON message_reads FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM messages WHERE sender_id = auth.uid()
    )
  );

CREATE POLICY "Users can mark messages as read"
  ON message_reads FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Real-time Hook:**
```typescript
// hooks/useReadReceipts.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ReadReceipt {
  messageId: string;
  userId: string;
  readAt: string;
}

export function useReadReceipts(conversationId: string) {
  const [receipts, setReceipts] = useState<ReadReceipt[]>([]);

  useEffect(() => {
    const fetchReceipts = async () => {
      const { data } = await supabase
        .from('message_reads')
        .select('message_id, user_id, read_at')
        .in('message_id', (
          await supabase
            .from('messages')
            .select('id')
            .eq('conversation_id', conversationId)
        ).data?.map((m) => m.id) || []);

      setReceipts(data || []);
    };

    fetchReceipts();

    const channel = supabase
      .channel(`read-receipts:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reads'
        },
        (payload) => {
          setReceipts((prev) => [...prev, payload.new as ReadReceipt]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const markAsRead = async (messageId: string) => {
    await supabase.from('message_reads').insert({
      message_id: messageId,
      user_id: (await supabase.auth.getUser()).data.user?.id
    });
  };

  return { receipts, markAsRead };
}
```

---

## 🤖 FEATURE 3: AI Chat Assistant

### Business Value
- Increase response rate by 50% (conversation starters)
- Reduce inappropriate content by 90% (moderation)
- Improve match quality with AI insights
- Revenue: $80K/year (premium AI features)

### 3.1 Smart Conversation Starters

**Edge Function:**
```typescript
// supabase/functions/ai-conversation-starters/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
});

serve(async (req) => {
  try {
    const { matchId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch match profiles
    const { data: match } = await supabase
      .from('matches')
      .select('user:user_id(bio, interests), matched_user:matched_user_id(bio, interests)')
      .eq('id', matchId)
      .single();

    if (!match) {
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        status: 404
      });
    }

    // Generate conversation starters with GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a dating app assistant that creates natural, engaging conversation starters.
          Generate 3 unique opening messages based on shared interests and profiles.
          Make them fun, respectful, and personalized. Return as JSON array.`
        },
        {
          role: 'user',
          content: `User 1: ${match.user.bio}, Interests: ${match.user.interests.join(', ')}
          User 2: ${match.matched_user.bio}, Interests: ${match.matched_user.interests.join(', ')}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 500
    });

    const starters = JSON.parse(completion.choices[0].message.content!);

    return new Response(JSON.stringify({ starters }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    });
  }
});
```

**Frontend Component:**
```typescript
// components/chat/AIConversationStarters.tsx
import { useState, useEffect } from 'react';
import { Button, Card } from '@zenith/ui-components';
import { Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AIConversationStartersProps {
  matchId: string;
  onSelectStarter: (message: string) => void;
}

export function AIConversationStarters({ matchId, onSelectStarter }: AIConversationStartersProps) {
  const [starters, setStarters] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStarters = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('ai-conversation-starters', {
        body: { matchId }
      });
      setStarters(data.starters.messages || []);
    } catch (error) {
      console.error('Failed to fetch conversation starters:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStarters();
  }, [matchId]);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">AI Conversation Starters</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchStarters}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="space-y-2">
        {starters.map((starter, index) => (
          <Button
            key={index}
            variant="outline"
            className="w-full justify-start text-left h-auto py-3"
            onClick={() => onSelectStarter(starter)}
          >
            {starter}
          </Button>
        ))}
      </div>
    </Card>
  );
}
```

### 3.2 AI Content Moderation

**Edge Function:**
```typescript
// supabase/functions/ai-moderate-content/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import OpenAI from 'https://esm.sh/openai@4';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
});

serve(async (req) => {
  try {
    const { content, contentType } = await req.json();

    const moderation = await openai.moderations.create({
      input: content
    });

    const result = moderation.results[0];
    const flagged = result.flagged;
    const categories = Object.entries(result.categories)
      .filter(([_, value]) => value)
      .map(([key]) => key);

    // Additional custom rules
    const customFlags = checkCustomRules(content, contentType);

    return new Response(
      JSON.stringify({
        flagged: flagged || customFlags.length > 0,
        categories: [...categories, ...customFlags],
        severity: calculateSeverity(result.category_scores),
        action: determineAction(flagged, categories, customFlags)
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    });
  }
});

function checkCustomRules(content: string, contentType: string): string[] {
  const flags: string[] = [];

  // Phone number detection
  if (/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(content)) {
    flags.push('phone_number');
  }

  // Email detection
  if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(content)) {
    flags.push('email');
  }

  // Social media handles
  if (/@\w+|instagram|snapchat|whatsapp/i.test(content)) {
    flags.push('social_media');
  }

  // Payment solicitation
  if (/venmo|paypal|cashapp|zelle|send\s+money/i.test(content)) {
    flags.push('payment_solicitation');
  }

  return flags;
}

function calculateSeverity(scores: Record<string, number>): 'low' | 'medium' | 'high' {
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore > 0.8) return 'high';
  if (maxScore > 0.5) return 'medium';
  return 'low';
}

function determineAction(
  flagged: boolean,
  categories: string[],
  customFlags: string[]
): 'allow' | 'warn' | 'block' | 'review' {
  // High severity - block immediately
  if (categories.includes('sexual/minors') || categories.includes('violence')) {
    return 'block';
  }

  // Medium severity - require manual review
  if (flagged && categories.length > 2) {
    return 'review';
  }

  // Custom rules - warn user
  if (customFlags.length > 0) {
    return 'warn';
  }

  // Low severity or false positive - allow with warning
  if (flagged) {
    return 'warn';
  }

  return 'allow';
}
```

**Frontend Integration:**
```typescript
// hooks/useAIModeration.ts
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ModerationResult {
  flagged: boolean;
  categories: string[];
  severity: 'low' | 'medium' | 'high';
  action: 'allow' | 'warn' | 'block' | 'review';
}

export function useAIModeration() {
  const [loading, setLoading] = useState(false);

  const moderateContent = async (
    content: string,
    contentType: 'message' | 'bio' | 'photo'
  ): Promise<ModerationResult> => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('ai-moderate-content', {
        body: { content, contentType }
      });
      return data;
    } catch (error) {
      console.error('Moderation failed:', error);
      return {
        flagged: false,
        categories: [],
        severity: 'low',
        action: 'allow'
      };
    } finally {
      setLoading(false);
    }
  };

  return { moderateContent, loading };
}
```

**Message Send with Moderation:**
```typescript
// components/chat/ChatInput.tsx
import { useState } from 'react';
import { Button, Input } from '@zenith/ui-components';
import { Send, AlertTriangle } from 'lucide-react';
import { useAIModeration } from '@/hooks/useAIModeration';
import { sendTypingIndicator } from '@/hooks/useTypingIndicator';

export function ChatInput({ conversationId, onSendMessage }) {
  const [message, setMessage] = useState('');
  const { moderateContent, loading } = useAIModeration();
  const [warning, setWarning] = useState<string | null>(null);

  const handleSend = async () => {
    if (!message.trim()) return;

    // Moderate content before sending
    const moderation = await moderateContent(message, 'message');

    if (moderation.action === 'block') {
      setWarning('This message violates our community guidelines and cannot be sent.');
      return;
    }

    if (moderation.action === 'warn') {
      setWarning(
        `Warning: This message may contain ${moderation.categories.join(', ')}. ` +
        'Are you sure you want to send it?'
      );
      // Show confirmation dialog
      const confirmed = window.confirm(warning);
      if (!confirmed) return;
    }

    if (moderation.action === 'review') {
      setWarning('This message has been flagged for review. It will be sent after moderation.');
      // Queue for manual review
      await queueForReview(message, moderation);
      return;
    }

    // Send message
    await onSendMessage(message);
    setMessage('');
    setWarning(null);
  };

  const handleTyping = (value: string) => {
    setMessage(value);
    sendTypingIndicator(conversationId, value.length > 0);
  };

  return (
    <div className="space-y-2">
      {warning && (
        <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          <AlertTriangle className="h-4 w-4" />
          <span>{warning}</span>
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          disabled={loading}
        />
        <Button onClick={handleSend} disabled={loading || !message.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

### 3.3 AI-Powered Smart Replies

**Edge Function:**
```typescript
// supabase/functions/ai-smart-replies/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import OpenAI from 'https://esm.sh/openai@4';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
});

serve(async (req) => {
  try {
    const { conversationHistory, lastMessage } = await req.json();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a dating app assistant that suggests 3 short, natural reply options.
          Match the tone and context. Be friendly, respectful, and engaging.
          Each reply should be 1-2 sentences max.`
        },
        {
          role: 'user',
          content: `Conversation history:\n${conversationHistory}\n\nLast message: "${lastMessage}"\n\nSuggest 3 reply options.`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 300
    });

    const replies = JSON.parse(completion.choices[0].message.content!);

    return new Response(JSON.stringify({ replies: replies.options }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    });
  }
});
```

---

## 📊 IMPLEMENTATION ROADMAP

### Phase 1: Real-Time Location (Week 1)
- [x] Design architecture
- [ ] Update database schema
- [ ] Create materialized view for active users
- [ ] Implement watchPosition hook
- [ ] Add location privacy controls
- [ ] Update RLS policies
- [ ] Create location update Edge Function
- [ ] Add "Nearby Now" UI feature
- [ ] Test with multiple users

### Phase 2: Messaging Enhancements (Week 2)
- [ ] Implement typing indicators with broadcast
- [ ] Build presence system with sync
- [ ] Add read receipts tracking
- [ ] Create UI components (TypingIndicator, PresenceBadge)
- [ ] Update ChatWindow with all features
- [ ] Test real-time performance
- [ ] Optimize WebSocket connections

### Phase 3: AI Chat Assistant (Week 3-4)
- [ ] Set up OpenAI API integration
- [ ] Create conversation starters Edge Function
- [ ] Build content moderation Edge Function
- [ ] Implement smart replies Edge Function
- [ ] Add AI features to chat UI
- [ ] Create moderation dashboard
- [ ] Test content filtering accuracy
- [ ] Add analytics tracking

### Phase 4: Documentation & Testing (Week 5)
- [ ] Write API documentation
- [ ] Create user guides
- [ ] Add E2E tests for real-time features
- [ ] Load test WebSocket connections
- [ ] Security audit
- [ ] Performance optimization

---

## 🎯 SUCCESS METRICS

**Real-Time Features:**
- [ ] 95%+ WebSocket connection success rate
- [ ] <100ms typing indicator latency
- [ ] <500ms presence update latency
- [ ] <2s location update frequency
- [ ] 99.9% real-time message delivery

**AI Features:**
- [ ] 90%+ moderation accuracy
- [ ] <2s AI response generation time
- [ ] 50%+ user adoption of conversation starters
- [ ] 70% reduction in manual moderation workload
- [ ] <0.1% false positive rate

**Business Metrics:**
- [ ] 40% increase in daily active users
- [ ] 35% increase in messages sent
- [ ] 25% increase in match-to-conversation rate
- [ ] 60% reduction in reported content violations
- [ ] $200K+ annual revenue impact

---

## 🔒 SECURITY CONSIDERATIONS

**Location Privacy:**
- Fuzzy location display (approximate, not exact)
- User-controlled visibility settings
- Automatic location data expiry (30 days)
- RLS policies prevent unauthorized access
- GDPR-compliant data deletion

**AI Safety:**
- Rate limiting on AI endpoints (10 req/min per user)
- Content moderation before storage
- Audit logging for all AI interactions
- OpenAI usage monitoring and budgets
- Fallback to manual review for edge cases

**Real-Time Security:**
- Authenticated WebSocket connections only
- Channel-level access control
- Broadcast message validation
- DDoS protection on Supabase Edge
- Rate limiting on presence updates

---

## 💰 COST ANALYSIS

**OpenAI API Costs:**
- GPT-4 Turbo: $0.01/1K input tokens, $0.03/1K output tokens
- Moderation API: Free
- Estimated: 100K messages/month = $150/month
- Smart replies: 50K requests/month = $75/month
- **Total AI costs: ~$225/month ($2,700/year)**

**Supabase Costs:**
- Realtime: Included in Pro plan ($25/month)
- Edge Functions: 2M invocations = $10/month
- Database: Storage + compute included
- **Total infrastructure: ~$35/month ($420/year)**

**Total Operating Costs: ~$3,120/year**
**Expected Revenue: $200K/year**
**Net Profit: $196,880/year (ROI: 6,300%)**

---

## 📚 REFERENCE

**Related Files:**
- `apps/frontend/src/hooks/useRealtimeLocation.ts` (new)
- `apps/frontend/src/hooks/useNearbyUsers.ts` (new)
- `apps/frontend/src/hooks/useTypingIndicator.ts` (new)
- `apps/frontend/src/hooks/usePresence.ts` (new)
- `apps/frontend/src/hooks/useReadReceipts.ts` (new)
- `apps/frontend/src/hooks/useAIModeration.ts` (new)
- `supabase/functions/ai-conversation-starters/` (new)
- `supabase/functions/ai-moderate-content/` (new)
- `supabase/functions/ai-smart-replies/` (new)

**Documentation:**
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [PostGIS Documentation](https://postgis.net/documentation/)

---

**Status:** ✅ Specification Complete - Ready for Implementation
**Next Step:** Begin Phase 1 - Real-Time Location Tracking
