/**
 * 🔄 Infinite Query Hook for Messages
 * Advanced data fetching with infinite scrolling for chat messages
 */

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Message } from '@/types';

interface UseInfiniteMessagesOptions {
  conversationId: string;
  pageSize?: number;
  enabled?: boolean;
}

interface MessagesPage {
  messages: Message[];
  nextCursor: number | undefined;
}

export function useInfiniteMessages({
  conversationId,
  pageSize = 50,
  enabled = true,
}: UseInfiniteMessagesOptions) {
  return useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const from = pageParam * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('messages')
        .select(
          `
          id,
          content,
          sender_id,
          receiver_id,
          created_at,
          read,
          type,
          sender:profiles!sender_id (
            id,
            name,
            avatar_url
          ),
          receiver:profiles!receiver_id (
            id,
            name,
            avatar_url
          )
        `,
        )
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        messages: data as Message[],
        nextCursor: data.length === pageSize ? pageParam + 1 : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: MessagesPage) => lastPage.nextCursor,
    enabled: enabled && !!conversationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Hook for optimistic message updates with infinite query
 */
export function useOptimisticInfiniteMessages(conversationId: string) {
  const query = useInfiniteMessages({ conversationId });
  const queryClient = useQueryClient();

  const addOptimisticMessage = (message: Message) => {
    queryClient.setQueryData(['messages', conversationId], (oldData: any) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        pages: oldData.pages.map((page: any, index: number) =>
          index === 0
            ? { ...page, messages: [message, ...page.messages] }
            : page,
        ),
      };
    });
  };

  const removeOptimisticMessage = (tempId: string) => {
    queryClient.setQueryData(['messages', conversationId], (oldData: any) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          messages: page.messages.filter((msg: Message) => msg.id !== tempId),
        })),
      };
    });
  };

  return {
    ...query,
    addOptimisticMessage,
    removeOptimisticMessage,
  };
}
