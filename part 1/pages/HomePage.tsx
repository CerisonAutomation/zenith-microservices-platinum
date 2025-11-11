/**
 * 🏠 Home Page - Landing/Dashboard
 */

import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { AuthFlow } from '@/components/auth/AuthFlow';

export default function HomePage() {
  const { user, loading } = useAuth();
  const devMode = import.meta.env['VITE_DEV_MODE'] === 'true';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-black to-pink-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // In dev mode, skip auth and go straight to explore
  if (devMode) {
    return <Navigate to="/explore" replace />;
  }

  if (!user) {
    return <AuthFlow />;
  }

  return <Navigate to="/explore" replace />;
}
