import React from 'react';
import { User } from 'firebase/auth';
import { LayoutDashboard, PlusCircle, BarChart3, UserCircle, LogOut, Sparkles, Dumbbell } from 'lucide-react';
import { auth } from '../firebase';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  user: User;
}

export function Layout({ children, activeTab, setActiveTab, user }: LayoutProps) {
  const tabs = [
    { id: 'dashboard', label: 'TỔNG QUAN', icon: LayoutDashboard },
    { id: 'entries', label: 'NHẬP LIỆU', icon: PlusCircle },
    { id: 'reports', label: 'BÁO CÁO', icon: BarChart3 },
    { id: 'analysis', label: 'PHÂN TÍCH', icon: Sparkles },
    { id: 'profile', label: 'CÁ NHÂN', icon: UserCircle },
  ];

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center shadow-md">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="logo font-extrabold text-lg tracking-tighter text-text-primary">
            TÔI SẼ GẦY
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:block text-text-secondary text-sm mr-4">
            {format(new Date(), 'EEEE, dd MMMM, yyyy')}
          </div>
          <button onClick={() => auth.signOut()} className="md:hidden p-2 text-rose-500">
            <LogOut className="w-5 h-5" />
          </button>
          <button onClick={() => setActiveTab('reports')} className="hidden md:block btn-density">Báo cáo Tuần</button>
          <button onClick={() => setActiveTab('reports')} className="hidden md:block btn-density">Báo cáo Tháng</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar for Desktop */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-border p-4">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[12px] font-bold transition-all",
                  activeTab === tab.id
                    ? "bg-neutral-100 text-accent-net"
                    : "text-text-secondary hover:bg-neutral-50 hover:text-text-primary"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-4 border-t border-border space-y-2">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full border border-border bg-neutral-100 flex items-center justify-center text-[10px] font-bold text-text-secondary uppercase">
                {user.displayName ? user.displayName.charAt(0) : user.email?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-text-primary truncate">{user.displayName || 'Người dùng'}</p>
                <p className="text-[10px] text-text-secondary truncate">{user.email?.split('@')[0]}</p>
              </div>
            </div>
            <button 
              onClick={() => auth.signOut()}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-[10px] font-bold text-rose-500 hover:bg-rose-50 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              ĐĂNG XUẤT
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-5">
          <div className="max-w-[1200px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border flex justify-around p-2 z-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all",
              activeTab === tab.id ? "text-accent-net" : "text-text-secondary"
            )}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[9px] font-bold">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
