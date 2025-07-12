import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  animateOnHover?: boolean;
}

export default function GlassCard({ children, className = '', animateOnHover = false }: GlassCardProps) {
  const baseClasses = "backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl shadow-lg overflow-hidden";
  
  if (!animateOnHover) {
    return (
      <div className={`${baseClasses} ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <motion.div 
      whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(80, 120, 255, 0.3)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`${baseClasses} ${className}`}
    >
      {children}
    </motion.div>
  );
}
