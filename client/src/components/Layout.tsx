import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Upload, TrendingUp, Home, Menu, X, Clock, Droplets, Info } from 'lucide-react';
import { useState } from 'react';
import Button from './Button';
import WalletConnect from './WalletConnect';
import NetworkStatus from './NetworkStatus';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Upload', href: '/upload', icon: Upload },
    { name: 'Trade', href: '/trade', icon: TrendingUp },
    { name: 'Transactions', href: '/transactions', icon: Clock },
    { name: 'Liquidity', href: '/liquidity', icon: Droplets },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location === '/';
    }
    return location.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary/90 to-emerald-600/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-center text-white text-sm">
            <Info size={16} className="mr-2" />
            <span className="font-medium">
              Demo Version - Sample data shown | Full functionality available with wallet connection
            </span>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="fixed top-10 left-0 right-0 z-40 bg-white/5 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/">
                <motion.div 
                  className="flex items-center cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center relative overflow-hidden">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="relative z-10">
                        <path d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                        <path d="M12 8L18 11.5V16.5L12 20L6 16.5V11.5L12 8Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="2" fill="white"/>
                      </svg>
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    </div>
                    <h1 className="text-xl font-bold text-primary">
                      DataSwap
                    </h1>
                  </div>
                  <span className="ml-3 text-sm bg-primary/20 text-primary px-2 py-1 rounded-full">
                    Beta
                  </span>
                </motion.div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}>
                    <motion.div
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                        isActive(item.href)
                          ? 'text-white bg-white/10'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon size={18} className="mr-2" />
                      {item.name}
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            {/* Wallet Connect - Top Right */}
            <div className="hidden md:block">
              <WalletConnect />
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <Button
                variant="ghost"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white/5 backdrop-blur-lg">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}>
                    <div
                      className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                        isActive(item.href)
                          ? 'text-white bg-white/10'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon size={20} className="mr-3" />
                      {item.name}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Network Status Notification */}
      <NetworkStatus />

      {/* Main content with proper spacing */}
      <main className="pt-32 min-h-screen">
        {children}
      </main>
    </div>
  );
}