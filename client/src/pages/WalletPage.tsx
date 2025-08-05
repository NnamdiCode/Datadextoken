import { Network, Info } from 'lucide-react';
import Layout from '../components/Layout';
import IrysWalletManager from '../components/IrysWalletManager';

/**
 * Dedicated Irys Wallet Page showcasing enhanced POC features
 * Features from the Irys POC repository:
 * - Enhanced network detection and management
 * - Professional balance display with formatting
 * - Automatic network switching capabilities
 * - Comprehensive error handling
 * - Direct faucet and explorer integration
 * - Network configuration information
 */
export default function WalletPage() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Network className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-white">Irys Testnet Wallet</h1>
          </div>
          <p className="text-xl text-gray-300">
            Connect your MetaMask wallet to interact with Irys Testnet
          </p>
        </div>

        {/* Enhanced Wallet Manager */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <IrysWalletManager showNetworkInfo={true} />
        </div>

        {/* POC Features Information */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6">
          <h2 className="flex items-center text-lg font-semibold text-white mb-4">
            <Info className="w-5 h-5 mr-2" />
            Enhanced Irys POC Features
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div className="space-y-2">
              <h3 className="font-medium text-white">Network Management</h3>
              <ul className="space-y-1 text-gray-400">
                <li>• Automatic Irys Testnet detection</li>
                <li>• One-click network switching</li>
                <li>• Enhanced error handling</li>
                <li>• Network configuration display</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-white">Wallet Features</h3>
              <ul className="space-y-1 text-gray-400">
                <li>• Real-time IRYS balance display</li>
                <li>• Professional balance formatting</li>
                <li>• Direct testnet faucet access</li>
                <li>• Irys explorer integration</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-white">User Experience</h3>
              <ul className="space-y-1 text-gray-400">
                <li>• Enhanced connection flow</li>
                <li>• Better error messages</li>
                <li>• Toast notifications</li>
                <li>• Responsive design</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-white">Integration</h3>
              <ul className="space-y-1 text-gray-400">
                <li>• EIP-1193 standard compliance</li>
                <li>• MetaMask optimization</li>
                <li>• Direct RPC calls</li>
                <li>• Minimal dependencies</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Network Configuration Details */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Irys Testnet Configuration</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Network Name:</span>
              <span className="text-white font-mono">Irys Testnet</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Chain ID:</span>
              <span className="text-white font-mono">1270 (0x4F6)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">RPC URL:</span>
              <span className="text-white font-mono text-xs break-all">
                https://testnet-rpc.irys.xyz/v1/execution-rpc
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Currency Symbol:</span>
              <span className="text-white font-mono">IRYS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Currency Decimals:</span>
              <span className="text-white font-mono">18</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Block Explorer:</span>
              <a 
                href="https://testnet-explorer.irys.xyz/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline font-mono text-xs"
              >
                testnet-explorer.irys.xyz
              </a>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-4">
          <a
            href="https://irys.xyz/faucet"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 text-center transition-colors"
          >
            <div className="text-purple-400 font-medium">Testnet Faucet</div>
            <div className="text-sm text-gray-400 mt-1">Get test IRYS tokens</div>
          </a>
          <a
            href="https://testnet-explorer.irys.xyz/"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 text-center transition-colors"
          >
            <div className="text-blue-400 font-medium">Block Explorer</div>
            <div className="text-sm text-gray-400 mt-1">View transactions</div>
          </a>
          <a
            href="https://docs.irys.xyz/"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center transition-colors"
          >
            <div className="text-green-400 font-medium">Documentation</div>
            <div className="text-sm text-gray-400 mt-1">Learn about Irys</div>
          </a>
        </div>

        {/* Implementation Notes */}
        <div className="bg-gray-800/30 border border-gray-600 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-3">Implementation Notes</h2>
          <div className="text-sm text-gray-300 space-y-2">
            <p>
              This enhanced wallet interface incorporates features from the{' '}
              <a 
                href="https://github.com/0xdevrel/Irys-POC" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline"
              >
                Irys POC repository
              </a>
              {' '}to provide a professional, production-ready wallet experience.
            </p>
            <p>
              The implementation uses direct MetaMask Provider API (EIP-1193) for optimal performance
              and minimal bundle size, without external Web3 libraries.
            </p>
            <p>
              All wallet interactions require explicit user approval through MetaMask, ensuring
              security and user control over their assets.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}