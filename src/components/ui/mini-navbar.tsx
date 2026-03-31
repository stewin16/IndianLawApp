"use client";

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CommandPalette } from '@/components/CommandPalette';
import { useAuth } from '@/auth/AuthContext';

const NavLink = ({ href, children, isActive }: { href: string; children: React.ReactNode; isActive?: boolean }) => {
  return (
    <Link
      to={href}
      className={cn(
        "px-4 py-1.5 text-xs font-semibold transition-all duration-300 rounded-full relative group overflow-hidden uppercase tracking-wider",
        isActive
          ? "text-white bg-navy-india shadow-lg shadow-navy-india/20"
          : "text-navy-india/70 hover:text-navy-india hover:bg-navy-india/5"
      )}
    >
      <span className="relative z-10">{children}</span>
      {!isActive && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-saffron transition-all duration-300 group-hover:w-1/2" />
      )}
    </Link>
  );
};

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const navLinksData = [
    { label: 'Home', href: '/' },
    { label: 'Assistant', href: '/chat' },
    { label: 'Draft', href: '/draft' },
    { label: 'Compare', href: '/compare' },
    { label: 'Summarizer', href: '/summarize' },
    { label: 'AI Tools', href: '/features' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-premium border-b border-navy-india/5">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg overflow-hidden border border-navy-india/10 group-hover:border-saffron/50 transition-all duration-500 group-hover:rotate-6 shadow-sm bg-white p-0.5">
            <img src="/logo.png" alt="LegalAi" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-navy-india text-xl tracking-tighter group-hover:text-saffron transition-colors leading-none">
              LegalAi
            </span>
            <span className="text-[8px] font-mono font-bold text-navy-india/40 tracking-[0.2em] uppercase mt-0.5">
              Digital_India
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-6">
          <nav className="flex items-center gap-1 bg-navy-india/5 p-1 rounded-full border border-navy-india/5">
            {navLinksData.map((link) => (
              <NavLink key={link.href} href={link.href} isActive={location.pathname === link.href}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="h-6 w-[1px] bg-navy-india/10" />

          <CommandPalette />
        </div>

        {/* Action Button */}
        <div className="hidden lg:flex items-center gap-3">
          {!isAuthenticated ? (
            <Link to="/login">
              <Button className="rounded-full btn-navy px-5 h-9 text-xs uppercase tracking-widest font-bold">
                Login
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/chat">
                <Button className="rounded-full btn-navy px-5 h-9 text-xs uppercase tracking-widest font-bold">
                  Launch AI
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  void logout();
                }}
                className="rounded-full px-4 h-9 text-[10px] uppercase tracking-widest font-bold"
                title={user?.email || 'Logout'}
              >
                Logout
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <CommandPalette />
          <button
            className="p-2 text-navy-india/70 hover:bg-navy-india/5 rounded-full transition-colors"
            onClick={toggleMenu}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Tricolor Line Separator */}
      <div className="h-[2px] bg-gradient-to-r from-saffron via-white to-green-india w-full opacity-50" />

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden border-t border-navy-india/5 bg-white/95 backdrop-blur-xl absolute w-full left-0 top-[64px] shadow-2xl animate-in slide-in-from-top-2">
          <nav className="flex flex-col p-4 space-y-1">
            {navLinksData.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "px-4 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-between uppercase tracking-wider",
                  location.pathname === link.href
                    ? "text-white bg-navy-india shadow-lg shadow-navy-india/20"
                    : "text-navy-india/60 hover:bg-navy-india/5"
                )}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
                {location.pathname === link.href && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </Link>
            ))}

            {!isAuthenticated ? (
              <Link
                to="/login"
                className="px-4 py-3 mt-2 text-sm font-bold rounded-xl text-navy-india/80 hover:bg-navy-india/5 uppercase tracking-wider"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
            ) : (
              <button
                className="px-4 py-3 mt-2 text-sm font-bold rounded-xl text-navy-india/80 hover:bg-navy-india/5 uppercase tracking-wider text-left"
                onClick={() => {
                  void logout();
                  setIsOpen(false);
                }}
              >
                Logout
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
