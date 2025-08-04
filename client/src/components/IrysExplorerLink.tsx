import { ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface IrysExplorerLinkProps {
  transactionId: string;
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function IrysExplorerLink({ 
  transactionId, 
  className = "", 
  showIcon = true, 
  children 
}: IrysExplorerLinkProps) {
  const explorerUrl = `https://explorer.irys.xyz/tx/${transactionId}`;
  
  return (
    <motion.a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 text-[#00D85A] hover:text-[#00B047] transition-colors duration-200 ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {children || (
        <>
          <span className="text-sm font-medium">View on Irys Explorer</span>
          {showIcon && <ExternalLink className="w-4 h-4" />}
        </>
      )}
    </motion.a>
  );
}

interface IrysTransactionBadgeProps {
  transactionId: string;
  type: 'upload' | 'trade' | 'token';
  className?: string;
}

export function IrysTransactionBadge({ 
  transactionId, 
  type, 
  className = "" 
}: IrysTransactionBadgeProps) {
  const badgeColors = {
    upload: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
    trade: 'bg-green-500/20 border-green-500/30 text-green-300',
    token: 'bg-purple-500/20 border-purple-500/30 text-purple-300'
  };

  const typeLabels = {
    upload: 'Data Upload',
    trade: 'Token Swap',
    token: 'Token Creation'
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-sm ${badgeColors[type]} ${className}`}>
      <span className="text-xs font-medium">{typeLabels[type]}</span>
      <IrysExplorerLink 
        transactionId={transactionId} 
        className="text-inherit hover:text-white"
        showIcon={false}
      >
        <span className="text-xs">
          {transactionId.slice(0, 8)}...{transactionId.slice(-6)}
        </span>
        <ExternalLink className="w-3 h-3" />
      </IrysExplorerLink>
    </div>
  );
}