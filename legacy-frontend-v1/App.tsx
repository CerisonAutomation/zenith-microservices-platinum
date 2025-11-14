/**
 * 🚀 Main Application Component - DEMO MODE
 * 
 * Complete app setup with:
 * - Authentication context (DEMO MODE)
 * - Application state management
 * - Tab-based + Page-based routing
 * - All features accessible
 */

import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AppProvider } from "./contexts/AppContext";
import { LocationProvider } from "./contexts/LocationContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { Toaster } from "./components/ui/toaster";
import { ErrorBoundary } from "./components/ui/error-boundary";

// Authentication Components
import AuthCallback from "./components/auth/AuthCallback";
import SignIn from "./components/auth/SignIn";
import SignUp from "./components/auth/SignUp";
import PasswordReset from "./components/auth/PasswordReset";

// Main Dating App with Bottom Navigation
import DatingApp from "./components/DatingApp";

// Individual Pages
import ExplorePage from "./pages/ExplorePage";
import MessagesPage from "./pages/MessagesPage";
import FavoritesPage from "./pages/FavoritesPage";
import ProfilePage from "./pages/ProfilePage";
import WalletPage from "./pages/WalletPage";
import BookingsPage from "./pages/BookingsPage";
import NotificationsPage from "./pages/NotificationsPage";

// Loading fallback
const LoadingFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-amber-950 flex items-center justify-center p-4">
    <div className="text-center">
      <div className="relative mb-8">
        <div className="w-16 h-16 border-4 border-amber-500/20 rounded-full animate-spin mx-auto"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-amber-400 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        <div className="absolute inset-2 w-8 h-8 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full mx-auto animate-pulse"></div>
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-light text-amber-100">Loading your matches</h2>
        <p className="text-amber-200/70 text-sm">Finding the perfect connections...</p>
      </div>
      <div className="mt-6 flex justify-center space-x-1">
        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <LocationProvider>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Authentication Routes - Public */}
                <Route path="/auth/signin" element={<SignIn />} />
                <Route path="/auth/signup" element={<SignUp />} />
                <Route path="/auth/forgot-password" element={<PasswordReset />} />
                <Route path="/auth/reset-password" element={<PasswordReset />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Protected Main App Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <DatingApp />
                  </ProtectedRoute>
                } />

                {/* Protected Individual Page Routes */}
                <Route path="/explore" element={
                  <ProtectedRoute>
                    <ExplorePage />
                  </ProtectedRoute>
                } />
                <Route path="/messages" element={
                  <ProtectedRoute>
                    <MessagesPage />
                  </ProtectedRoute>
                } />
                <Route path="/favorites" element={
                  <ProtectedRoute>
                    <FavoritesPage />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="/wallet" element={
                  <ProtectedRoute>
                    <WalletPage />
                  </ProtectedRoute>
                } />
                <Route path="/bookings" element={
                  <ProtectedRoute>
                    <BookingsPage />
                  </ProtectedRoute>
                } />
                <Route path="/notifications" element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                } />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>

            {/* Global toast notifications */}
            <Toaster />
          </LocationProvider>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
