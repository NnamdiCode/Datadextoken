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
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mr-4 relative overflow-hidden shadow-2xl">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="relative z-10">
                  <path d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                  <path d="M12 8L18 11.5V16.5L12 20L6 16.5V11.5L12 8Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="2" fill="white"/>
                </svg>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold shiny-text">
                IrysDEX
              </h1>
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-cyan-300">
              Decentralized Data Exchange
            </h2>
            <p className="text-xl text-white mb-8 max-w-3xl mx-auto leading-relaxed">
              Upload your data to the Irys blockchain, receive unique tokens, and trade them on our automated market maker. 
              Turn your data into liquid assets with permanent storage and verifiable ownership.
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
