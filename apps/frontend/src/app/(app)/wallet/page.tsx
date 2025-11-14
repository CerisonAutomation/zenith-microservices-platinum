/**
 * 💳 Wallet Page - Payments and Subscriptions
 * Next.js 14 App Router page
 */

import WalletTab from '@/components/tabs/WalletTab'

export const metadata = {
  title: 'Wallet - Zenith Dating',
  description: 'Manage your payments and subscriptions',
}

export default function WalletPage() {
  return <WalletTab />
}
