/**
 * ⭐ Favorites Page - Your Liked Profiles
 * Next.js 14 App Router page
 */

import FavoritesTab from '@/components/tabs/FavoritesTab'

export const metadata = {
  title: 'Favorites - Zenith Dating',
  description: 'View your liked profiles and matches',
}

export default function FavoritesPage() {
  return <FavoritesTab />
}
