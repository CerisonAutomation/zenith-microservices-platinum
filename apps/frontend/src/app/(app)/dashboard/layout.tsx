import { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
  feed: ReactNode;
  sidebar: ReactNode;
  modal: ReactNode;
}

export default function DashboardLayout({
  children,
  feed,
  sidebar,
  modal,
}: DashboardLayoutProps) {
  return (
    <div className="h-full flex">
      {/* Main Feed - Left side (70%) */}
      <div className="flex-1 overflow-y-auto">
        {feed}
        {children}
      </div>

      {/* Sidebar - Right side (30%) */}
      <div className="w-80 border-l border-border overflow-y-auto hidden lg:block">
        {sidebar}
      </div>

      {/* Modal slot - Rendered on top when active */}
      {modal}
    </div>
  );
}
