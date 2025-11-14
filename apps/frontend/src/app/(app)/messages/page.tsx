/**
 * 💬 Messages Page - Chat with Matches
 * Next.js 14 App Router page
 */

import MessagesTab from '@/components/tabs/MessagesTab'

export const metadata = {
  title: 'Messages - Zenith Dating',
  description: 'Chat with your matches',
}

export default function MessagesPage() {
  return <MessagesTab />
}
