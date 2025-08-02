import { motion } from "framer-motion";
import { ArrowRight, Upload, TrendingUp, Shield, Zap, Globe, ExternalLink, Copy } from "lucide-react";
import { Link } from "wouter";
import GlassCard from "../components/GlassCard";
import Button from "../components/Button";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const { data: recentTokens } = useQuery({
    queryKey: ["/api/tokens"],
    queryFn: async () => {
      const response = await fetch("/api/tokens?limit=6");
      if (!response.ok) throw new Error("Failed to fetch tokens");
      return response.json();
    },
  });

  const { data: recentTrades } = useQuery({
    queryKey: ["/api/trades"],
    queryFn: async () => {
      const response = await fetch("/api/trades?limit=5");
      if (!response.ok) throw new Error("Failed to fetch trades");
      return response.json();
    },
  });

  return (
    <div className="min-h-screen relative">
      {/* Floating orbs for visual enhancement */}
      <div className="floating-orb"></div>
      <div className="floating-orb"></div>
      <div className="floating-orb"></div>
      
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 shiny-text">
              Tokenize & Trade Your Data
            </h1>
            <p className="text-xl text-white mb-8 max-w-3xl mx-auto leading-relaxed">
              Upload your data to the Irys blockchain, receive unique tokens, and trade them on our decentralized exchange. 
              Turn your data into liquid assets.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/upload">
                <Button size="lg" icon={<Upload size={20} />} className="glossy-button">
                  Upload Data
                </Button>
              </Link>
              <Link href="/trade">
                <Button variant="outline" size="lg" icon={<TrendingUp size={20} />} className="glossy-button">
                  Start Trading
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 shiny-text">Why Choose DataSwap?</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Built on Irys blockchain for fast, secure, and cost-effective data tokenization
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <GlassCard animateOnHover className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="text-blue-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2 gradient-text">Lightning Fast</h3>
              <p className="text-gray-300">
                100,000 TPS on Irys blockchain - 6,000x faster than traditional storage solutions
              </p>
            </GlassCard>

            <GlassCard animateOnHover className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-purple-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2 gradient-text">Secure & Decentralized</h3>
              <p className="text-gray-300">
                Your data is cryptographically secured and permanently stored on the blockchain
              </p>
            </GlassCard>

            <GlassCard animateOnHover className="p-6 text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="text-green-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2 gradient-text">Global Marketplace</h3>
              <p className="text-gray-300">
                Trade your data tokens with users worldwide through our automated market maker
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Recent Tokens */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-white">Recently Tokenized Data</h2>
            <Link href="/trade">
              <Button variant="outline" size="sm" icon={<ArrowRight size={16} />}>
                View All
              </Button>
            </Link>
          </div>

          {recentTokens?.tokens ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentTokens.tokens.map((token: any) => (
                <GlassCard key={token.id} animateOnHover className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{token.name}</h3>
                      <p className="text-sm text-gray-400">{token.symbol}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-400 font-medium">{token.currentPrice.toFixed(3)} IRYS</p>
                      <p className="text-xs text-gray-400">
                        Cap: {((token.currentPrice * 1000000000) / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-xs text-gray-400">{(token.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                    {token.description || "No description provided"}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                        {token.fileType.split('/')[1]?.toUpperCase() || 'DATA'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(token.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="border-t border-white/10 pt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded-full">
                          {token.category ? token.category.charAt(0).toUpperCase() + token.category.slice(1) : 'Other'}
                        </span>
                        <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded-full font-mono">
                          {token.symbol}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">On Irys Blockchain</span>
                        <a
                          href={`https://devnet.irys.xyz/tx/${token.irysTransactionId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <ExternalLink size={10} className="mr-1" />
                          View
                        </a>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Upload size={48} className="mx-auto mb-4 opacity-50" />
              <p>No tokens found. Be the first to upload data!</p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Trades */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Recent Trades</h2>
          
          {recentTrades?.trades ? (
            <GlassCard className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/10">
                    <tr>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-300">From</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-300">To</th>
                      <th className="text-right py-4 px-6 text-sm font-medium text-gray-300">Amount In</th>
                      <th className="text-right py-4 px-6 text-sm font-medium text-gray-300">Amount Out</th>
                      <th className="text-right py-4 px-6 text-sm font-medium text-gray-300">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrades.trades.map((trade: any) => (
                      <tr key={trade.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-4 px-6">
                          <span className="text-sm font-mono">
                            {trade.fromTokenAddress.slice(0, 8)}...
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-mono">
                            {trade.toTokenAddress.slice(0, 8)}...
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="text-sm">{parseFloat(trade.amountIn).toFixed(6)}</span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="text-sm">{parseFloat(trade.amountOut).toFixed(6)}</span>
                        </td>
                        <td className="py-4 px-6 text-right text-sm text-gray-400">
                          {new Date(trade.executedAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
              <p>No trades yet. Start trading to see activity!</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <GlassCard className="p-12 bg-card border-primary/30">
            <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-gray-300 mb-8">
              Join the decentralized data economy. Upload your first dataset and start earning.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/upload">
                <Button size="lg" icon={<Upload size={20} />}>
                  Upload Your First File
                </Button>
              </Link>
              <Link href="/trade">
                <Button variant="outline" size="lg" icon={<TrendingUp size={20} />}>
                  Explore Marketplace
                </Button>
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
