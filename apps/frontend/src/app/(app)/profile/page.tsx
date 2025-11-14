/**
 * 👤 Profile Page - User Profile Management
 * Next.js 14 App Router page
 */

import ProfileTab from '@/components/tabs/ProfileTab'

export const metadata = {
  title: 'Profile - Zenith Dating',
  description: 'Manage your profile and settings',
}

export default function ProfilePage() {
  return <ProfileTab />
}
