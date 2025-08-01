import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  animateOnHover?: boolean;
}

export default function GlassCard({ children, className, animateOnHover = false }: GlassCardProps) {
  const cardContent = (
    <div 
      className={cn(
        "bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl floating-card glass-card-enhanced",
        className
      )}
    >
      {children}
    </div>
  );

  if (animateOnHover) {
    return (
      <motion.div
        whileHover={{ 
          scale: 1.02,
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: 0.98 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
}
