import { motion } from 'framer-motion';
import { ArrowRight, BarChart4, ShieldCheck, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';

export default function HomePage() {
  const features = [
    {
      icon: <Upload className="text-blue-400" />,
      title: "Upload & Tokenize",
      description: "Upload your data and receive a unique token that represents ownership of your data on the blockchain."
    },
    {
      icon: <BarChart4 className="text-purple-400" />,
      title: "Trade Tokens",
      description: "Exchange your data tokens with others on our integrated Automated Market Maker (AMM)."
    },
    {
      icon: <ShieldCheck className="text-green-400" />,
      title: "Secure & Decentralized",
      description: "All transactions are secure and recorded on the Irys blockchain for maximum transparency."
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="py-12 md:py-20">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
            <span className="block">Tokenize Your Data on</span>
            <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
              The Irys Blockchain
            </span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-300">
            Upload your data, receive tokens, and trade them on our decentralized exchange. Control your data like never before.
          </p>
          <div className="mt-10 flex justify-center gap-4 flex-wrap">
            <Link to="/upload">
              <Button size="lg" icon={<Upload size={18} />}>
                Start Uploading
              </Button>
            </Link>
            <Link to="/trade">
              <Button size="lg" variant="secondary" icon={<BarChart4 size={18} />}>
                Explore Trading
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Features Section */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {features.map((feature, index) => (
          <motion.div key={index} variants={item}>
            <GlassCard animateOnHover className="h-full p-8">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full p-4 bg-white/5 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* How It Works Section */}
      <div className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">How It Works</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-600 mx-auto mt-4 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <GlassCard className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-500/20 text-blue-400 mb-4">
                1
              </div>
              <h3 className="text-lg font-medium mb-2">Upload Your Data</h3>
              <p className="text-gray-400 text-sm">
                Choose your data file, set a name and description, and pay a small fee in IRYS tokens.
              </p>
            </div>
          </GlassCard>
          
          <GlassCard className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-500/20 text-purple-400 mb-4">
                2
              </div>
              <h3 className="text-lg font-medium mb-2">Receive Your Token</h3>
              <p className="text-gray-400 text-sm">
                After upload, you'll receive a unique DATA token representing ownership of your data.
              </p>
            </div>
          </GlassCard>
          
          <GlassCard className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-green-500/20 text-green-400 mb-4">
                3
              </div>
              <h3 className="text-lg font-medium mb-2">Trade on the DEX</h3>
              <p className="text-gray-400 text-sm">
                Use our AMM to trade your data tokens with tokens representing other users' data.
              </p>
            </div>
          </GlassCard>
        </div>
        
        <div className="flex justify-center mt-12">
          <Link to="/upload">
            <Button 
              variant="outline" 
              icon={<ArrowRight size={16} />}
              className="group"
            >
              <span className="mr-1">Get Started Now</span>
              <motion.span 
                className="inline-block"
                initial={{ x: 0 }}
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                →
              </motion.span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16">
        <GlassCard className="p-8 md:p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                5.2K+
              </div>
              <p className="mt-2 text-sm text-gray-400">Data Uploads</p>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                $1.8M
              </div>
              <p className="mt-2 text-sm text-gray-400">Trading Volume</p>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-400">
                894
              </div>
              <p className="mt-2 text-sm text-gray-400">Active Traders</p>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-400">
                12K+
              </div>
              <p className="mt-2 text-sm text-gray-400">Transactions</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
