import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Menu, X, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { DarkModeToggle } from './DarkModeToggle';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: 'grid' },
  { label: 'Recipients', href: '/recipients', icon: 'users' },
  { label: 'Add Recipient', href: '/recipients/new', icon: 'plus' },
];

export function Layout({ children, currentPage }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleLogout = async () => {
    await signOut();
    showToast('Signed out successfully', 'success');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-bg-secondary">
      <nav className="bg-bg-primary shadow-sm border-b border-border-color">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Gift className="w-6 h-6 text-accent" />
              <span className="text-xl font-bold text-text-primary">GiftTracker</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  className={`text-sm font-medium transition-colors ${
                    currentPage === item.href
                      ? 'text-accent'
                      : 'text-text-secondary hover:text-accent'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 text-sm text-text-secondary">
                <span>{user?.email}</span>
              </div>
              <DarkModeToggle />
              <button
                onClick={() => navigate('/settings')}
                className="p-2 text-text-secondary hover:text-accent transition-colors rounded-lg"
                title="Settings"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-text-secondary hover:text-red-500 transition-colors rounded-lg"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-text-secondary hover:text-accent rounded-lg"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => {
                    navigate(item.href);
                    setMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === item.href
                      ? 'bg-accent text-white'
                      : 'text-text-primary hover:bg-bg-secondary'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
