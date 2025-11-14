import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const LandingPage = dynamic(() => import('../pages/LandingPage').then(mod => ({ default: mod.LandingPage })), {
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-amber-900/20 to-gray-900">
      <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
    </div>
  ),
  ssr: false
});

export default function Home() {
  return <LandingPage />
}