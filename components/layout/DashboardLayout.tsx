'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Calendar,
  Stethoscope,
  FlaskConical,
  Pill,
  Cpu,
  ListTodo,
  HelpCircle,
  Search,
  Moon,
  Sun,
  Menu,
  X,
  Heart,
  User,
  Settings,
  ChevronDown,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMedicalStore } from '@/lib/store';
import { COMPLETE_MEDICAL_DATA, getStatistics } from '@/lib/medical-data';
import { GlobalSearch, useGlobalSearch } from '@/components/search/GlobalSearch';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
  { href: '/timeline', label: 'Timeline', icon: <Calendar className="w-5 h-5" /> },
  { href: '/conditions', label: 'Conditions', icon: <Stethoscope className="w-5 h-5" /> },
  { href: '/labs', label: 'Lab Results', icon: <FlaskConical className="w-5 h-5" /> },
  { href: '/medications', label: 'Medications', icon: <Pill className="w-5 h-5" /> },
  { href: '/devices', label: 'Implants', icon: <Cpu className="w-5 h-5" /> },
  { href: '/actions', label: 'Action Items', icon: <ListTodo className="w-5 h-5" /> },
  { href: '/documents', label: 'Documents', icon: <FileText className="w-5 h-5" /> },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { loadAllData, patient } = useMedicalStore();
  const { isOpen: searchOpen, setIsOpen: setSearchOpen } = useGlobalSearch();

  // Load data on mount
  useEffect(() => {
    loadAllData(COMPLETE_MEDICAL_DATA);
  }, [loadAllData]);

  // Theme toggle
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const stats = getStatistics();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-card border-r z-50 transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Dr. Nexus</h1>
              <p className="text-xs text-muted-foreground">Medical Dashboard</p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Stats Summary */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-muted/50">
          <div className="text-xs text-muted-foreground mb-2">Quick Stats</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 bg-background rounded-lg">
              <div className="text-lg font-bold text-blue-600">{stats.totalEvents}</div>
              <div className="text-xs text-muted-foreground">Events</div>
            </div>
            <div className="text-center p-2 bg-background rounded-lg">
              <div className="text-lg font-bold text-green-600">{stats.conditions.resolved}</div>
              <div className="text-xs text-muted-foreground">Resolved</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur-sm border-b flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-2 hover:bg-muted/80 transition-colors"
            >
              <Search className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground w-48 text-left">Search medical records...</span>
              <kbd className="hidden lg:inline-flex h-5 px-1.5 items-center gap-1 rounded border bg-background font-mono text-[10px] text-muted-foreground">
                Ctrl+K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </Button>

            {/* User menu */}
            <div className="flex items-center gap-3 pl-3 border-l">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium">{patient?.name || 'Loading...'}</p>
                <p className="text-xs text-muted-foreground">Patient</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {patient?.name?.split(' ').map(n => n[0]).join('') || 'ZW'}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t py-4 px-6 text-center text-sm text-muted-foreground">
          <p>Dr. Nexus Medical Dashboard v2.0.0 - {stats.timespan.years} years of medical history</p>
        </footer>
      </div>

      {/* Global Search Modal */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
