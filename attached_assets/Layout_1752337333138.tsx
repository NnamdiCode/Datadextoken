import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChartBig, House, Menu, Upload, Wallet, X } from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  const navLinks = [
    { name: 'House', path: '/', icon: <House size={18} /> },
    { name: 'Upload', path: '/upload', icon: <Upload size={18} /> },
    { name: 'Trade', path: '/trade', icon: <BarChartBig size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white font-[SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif]">
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600"
                >
                  DataSwap
                </motion.div>
              </Link>
              <div className="hidden sm:ml-10 sm:flex sm:space-x-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      location.pathname === link.path
                        ? 'bg-white/10 text-blue-400'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {link.icon}
                    <span className="ml-2">{link.name}</span>
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="hidden sm:flex items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center px-4 py-2 rounded-md bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium text-sm"
              >
                <Wallet size={16} className="mr-2" />
                Connect Wallet
              </motion.button>
            </div>
            
            <div className="flex items-center sm:hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="sm:hidden bg-gray-900/90 backdrop-blur-lg border-b border-white/10"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                    location.pathname === link.path
                      ? 'bg-white/10 text-blue-400'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.icon}
                  <span className="ml-2">{link.name}</span>
                </Link>
              ))}
              <button className="mt-4 w-full flex items-center justify-center px-4 py-2 rounded-md bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium text-sm">
                <Wallet size={16} className="mr-2" />
                Connect Wallet
              </button>
            </div>
          </motion.div>
        )}
      </div>
      
      <main className="pt-16 pb-12">
        {children}
      </main>
      
      <footer className="bg-black/30 backdrop-blur-md border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-400">
              © 2025 DataSwap. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                Terms
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                Privacy
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                Docs
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
