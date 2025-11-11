/**
 * 🏛️ ZENITH ORACLE EXECUTIVE APEX LAYOUT SYSTEM
 * Transcendent-grade layout with mathematical precision and opulent aesthetics
 * Enterprise-grade layout system with atomic architecture and platinum intelligence
 */

import React, { forwardRef, useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { platinumTokens } from '@/design-system/platinum-tokens'
import { Button } from '@/components/ui/platinum-button'
import { Avatar } from '@/components/ui/platinum-avatar'
import { 
  Menu, 
  X, 
  Home, 
  Search, 
  Heart, 
  MessageCircle, 
  User, 
  Settings, 
  Bell,
  LogOut,
  Crown,
  Shield,
  Star
} from 'lucide-react'

// Oracle-grade layout interface
export interface MainLayoutProps {
  children: React.ReactNode
  // Navigation configuration
  navigation?: {
    showSidebar?: boolean
    sidebarCollapsed?: boolean
    onSidebarToggle?: () => void
  }
  // Header configuration
  header?: {
    showUserMenu?: boolean
    showNotifications?: boolean
    title?: string
    subtitle?: string
  }
  // Footer configuration
  footer?: {
    show?: boolean
    content?: React.ReactNode
  }
  // Responsive behavior
  responsive?: {
    mobileBreakpoint?: 'sm' | 'md' | 'lg' | 'xl'
    collapseOnMobile?: boolean
  }
  // Platinum aesthetics
  aesthetics?: {
    glassmorphism?: boolean
    shimmer?: boolean
    glow?: boolean
    animations?: boolean
  }
}

// Transcendent main layout component
const MainLayout = forwardRef<HTMLDivElement, MainLayoutProps>(
  ({
    children,
    navigation = { showSidebar: true, sidebarCollapsed: false },
    header = { showUserMenu: true, showNotifications: true },
    footer = { show: true },
    responsive = { mobileBreakpoint: 'lg', collapseOnMobile: true },
    aesthetics = { glassmorphism: true, shimmer: true, glow: true, animations: true },
    ...props
  }, ref) => {
    // Internal state
    const [sidebarCollapsed, setSidebarCollapsed] = useState(navigation.sidebarCollapsed || false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    
    // Handle responsive behavior
    useEffect(() => {
      const handleResize = () => {
        const breakpoint = responsive.mobileBreakpoint || 'lg'
        const breakpointWidth = {
          sm: 640,
          md: 768,
          lg: 1024,
          xl: 1280
        }[breakpoint]
        
        const mobile = window.innerWidth < breakpointWidth
        setIsMobile(mobile)
        
        if (responsive.collapseOnMobile && mobile) {
          setSidebarCollapsed(true)
        }
      }
      
      handleResize()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }, [responsive.mobileBreakpoint, responsive.collapseOnMobile])
    
    // Handle sidebar toggle
    const handleSidebarToggle = useCallback(() => {
      if (isMobile) {
        setMobileMenuOpen(!mobileMenuOpen)
      } else {
        setSidebarCollapsed(!sidebarCollapsed)
      }
      navigation.onSidebarToggle?.()
    }, [isMobile, mobileMenuOpen, sidebarCollapsed, navigation.onSidebarToggle])
    
    // Navigation items configuration
    const navigationItems = [
      { icon: Home, label: 'Home', href: '/', active: true },
      { icon: Search, label: 'Discover', href: '/discover' },
      { icon: Heart, label: 'Matches', href: '/matches' },
      { icon: MessageCircle, label: 'Messages', href: '/messages' },
      { icon: User, label: 'Profile', href: '/profile' },
    ]
    
    const secondaryNavigationItems = [
      { icon: Settings, label: 'Settings', href: '/settings' },
      { icon: Crown, label: 'Premium', href: '/premium' },
      { icon: Shield, label: 'Safety', href: '/safety' },
    ]
    
    return (
      <div
        ref={ref}
        className={cn(
          'min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950',
          'text-neutral-100 overflow-hidden'
        )}
        {...props}
      >
        {/* Platinum background effects */}
        {aesthetics.glow && (
          <div className="fixed inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500" />
          </div>
        )}
        
        {/* Mobile menu overlay */}
        {isMobile && mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        {navigation.showSidebar && (
          <aside
            className={cn(
              'fixed left-0 top-0 h-full bg-gradient-to-b from-neutral-900/95 to-neutral-800/95 backdrop-blur-xl border-r border-neutral-700/50 z-50 transition-all duration-300 ease-in-out',
              sidebarCollapsed ? 'w-20' : 'w-64',
              isMobile && !mobileMenuOpen && '-translate-x-full',
              aesthetics.glow && 'shadow-2xl shadow-black/50'
            )}
          >
            {/* Sidebar header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-700/50">
              {!sidebarCollapsed && (
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <Crown className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-lg font-semibold text-white">Zenith</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSidebarToggle}
                className="text-neutral-400 hover:text-white"
              >
                {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </Button>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {/* Primary navigation */}
              <div className="space-y-1">
                {navigationItems.map((item) => (
                  <Button
                    key={item.href}
                    variant={item.active ? 'secondary' : 'ghost'}
                    size={sidebarCollapsed ? 'sm' : 'md'}
                    className={cn(
                      'w-full justify-start',
                      sidebarCollapsed ? 'px-2' : 'px-4',
                      item.active && 'bg-gradient-to-r from-violet-600/20 to-purple-600/20'
                    )}
                  >
                    <item.icon className={cn('h-4 w-4', !sidebarCollapsed && 'mr-3')} />
                    {!sidebarCollapsed && item.label}
                  </Button>
                ))}
              </div>
              
              {/* Secondary navigation */}
              {!sidebarCollapsed && (
                <div className="pt-4 mt-4 border-t border-neutral-700/50 space-y-1">
                  {secondaryNavigationItems.map((item) => (
                    <Button
                      key={item.href}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start px-4 text-neutral-400 hover:text-white"
                    >
                      <item.icon className="h-4 w-4 mr-3" />
                      {item.label}
                    </Button>
                  ))}
                </div>
              )}
            </nav>
            
            {/* User section */}
            <div className="p-4 border-t border-neutral-700/50">
              <div className={cn(
                'flex items-center',
                sidebarCollapsed ? 'justify-center' : 'space-x-3'
              )}>
                <Avatar
                  size="sm"
                  variant="elevated"
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=zenith"
                  fallback="Zenith User"
                />
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">Zenith User</p>
                    <p className="text-xs text-neutral-400 truncate">Premium Member</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}
        
        {/* Main content area */}
        <div className={cn(
          'transition-all duration-300 ease-in-out',
          navigation.showSidebar && (sidebarCollapsed ? 'ml-20' : 'ml-64')
        )}>
          {/* Header */}
          <header className={cn(
            'sticky top-0 z-30 border-b border-neutral-700/50',
            aesthetics.glassmorphism && 'bg-neutral-900/80 backdrop-blur-xl',
            aesthetics.glow && 'shadow-lg shadow-black/20'
          )}>
            <div className="flex items-center justify-between px-6 py-4">
              {/* Left side */}
              <div className="flex items-center space-x-4">
                {!navigation.showSidebar && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSidebarToggle}
                    className="text-neutral-400 hover:text-white"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                )}
                <div>
                  <h1 className="text-xl font-semibold text-white">{header.title || 'Zenith'}</h1>
                  {header.subtitle && (
                    <p className="text-sm text-neutral-400">{header.subtitle}</p>
                  )}
                </div>
              </div>
              
              {/* Right side */}
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                {header.showNotifications && (
                  <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white relative">
                    <Bell className="h-4 w-4" />
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
                  </Button>
                )}
                
                {/* User menu */}
                {header.showUserMenu && (
                  <div className="flex items-center space-x-3">
                    <Avatar
                      size="sm"
                      variant="elevated"
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=zenith"
                      fallback="Zenith User"
                      badge={{ type: 'premium', show: true }}
                    />
                  </div>
                )}
              </div>
            </div>
          </header>
          
          {/* Main content */}
          <main className="flex-1 p-6">
            {children}
          </main>
          
          {/* Footer */}
          {footer.show && (
            <footer className={cn(
              'border-t border-neutral-700/50 py-6 px-6',
              aesthetics.glassmorphism && 'bg-neutral-900/80 backdrop-blur-xl'
            )}>
              {footer.content || (
                <div className="flex items-center justify-between text-sm text-neutral-400">
                  <p>&copy; 2025 Zenith. All rights reserved.</p>
                  <div className="flex items-center space-x-4">
                    <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
                    <a href="/terms" className="hover:text-white transition-colors">Terms</a>
                    <a href="/support" className="hover:text-white transition-colors">Support</a>
                  </div>
                </div>
              )}
            </footer>
          )}
        </div>
      </div>
    )
  }
)

MainLayout.displayName = 'OracleExecutiveApexMainLayout'

export { MainLayout }