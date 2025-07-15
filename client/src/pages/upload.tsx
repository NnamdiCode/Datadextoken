import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Clock, FileText, Info, Upload, BarChart2, AlertCircle, Image, X } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import { useToast } from '../hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import WalletConnect from '../components/WalletConnect';
import { useWallet } from '../hooks/useWallet';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFee, setSelectedFee] = useState('0.05');
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [tokenResult, setTokenResult] = useState<any>(null);
  const [paymentTxHash, setPaymentTxHash] = useState('');
  const [uploadCost, setUploadCost] = useState<string>('');
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { account, isConnected } = useWallet();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Add necessary metadata for Irys blockchain upload
      formData.append('name', name);
      formData.append('description', description);
      formData.append('creatorAddress', account || '');
      
      // Add image file if selected
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setTokenResult(data);
      setStep(4); // Move to final step
      toast({ 
        title: 'Success!', 
        description: 'Your data has been uploaded to Irys blockchain and tokenized for trading' 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tokens'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Upload failed', 
        description: error.message || 'Unknown error occurred',
        variant: 'destructive'
      });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check file size (50MB limit)
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast({ 
          title: 'File too large', 
          description: 'Maximum file size is 50MB',
          variant: 'destructive'
        });
        return;
      }
      
      setFile(selectedFile);
      setName(selectedFile.name.split('.')[0]); // Auto-fill name from filename
      setStep(2);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedImage = e.target.files[0];
      
      // Check if it's an image
      if (!selectedImage.type.startsWith('image/')) {
        toast({ 
          title: 'Invalid file type', 
          description: 'Please select an image file',
          variant: 'destructive'
        });
        return;
      }
      
      // Check image size (10MB limit)
      if (selectedImage.size > 10 * 1024 * 1024) {
        toast({ 
          title: 'Image too large', 
          description: 'Maximum image size is 10MB',
          variant: 'destructive'
        });
        return;
      }
      
      setImageFile(selectedImage);
    }
  };
  
  const resetForm = () => {
    setFile(null);
    setImageFile(null);
    setStep(1);
    setName('');
    setDescription('');
    setSelectedFee('0.05');
    setTokenResult(null);
    setPaymentTxHash('');
    setUploadCost('');
    setIsPaymentComplete(false);
  };
  
  const handleUpload = async () => {
    if (!file || !name) return;
    
    if (!isConnected || !account) {
      toast({ title: 'Please connect your wallet first', variant: 'destructive' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    if (imageFile) {
      formData.append('image', imageFile);
    }
    formData.append('name', name);
    formData.append('description', description);
    formData.append('creatorAddress', account);
    
    uploadMutation.mutate(formData);
  };
  
  const feeOptions = [
    { value: '0.02', label: '0.02 ETH', speed: 'Slow', time: '~30 min' },
    { value: '0.05', label: '0.05 ETH', speed: 'Standard', time: '~5 min' },
    { value: '0.1', label: '0.1 ETH', speed: 'Fast', time: '~1 min' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Upload & Tokenize Your Data</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Convert your data into tradable tokens on the Irys blockchain. Set metadata, pay a small fee, and receive a unique token.
          </p>
        </div>
        <WalletConnect />
      </div>
      
      {/* Steps progress */}
      <div className="flex justify-between items-center mb-10 px-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              step === i 
                ? 'bg-primary text-primary-foreground' 
                : step > i 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white/10 text-gray-400'
            }`}>
              {step > i ? <Check size={18} /> : i}
            </div>
            <span className={`mt-2 text-xs transition-colors ${step >= i ? 'text-white' : 'text-gray-400'}`}>
              {i === 1 ? 'Upload' : i === 2 ? 'Configure' : i === 3 ? 'Payment' : 'Complete'}
            </span>
            
            {/* Connector line */}
            {i < 4 && (
              <div className="absolute top-5 left-10 w-full h-[2px] bg-white/10">
                <div 
                  className={`h-full bg-primary transition-all duration-500 ${
                    step > i ? 'w-full' : 'w-0'
                  }`}
                ></div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <GlassCard className="mb-8">
        {step === 1 && (
          <div className="p-6">
            <h2 className="text-xl font-medium mb-4">Select Your Data File</h2>
            
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                file ? 'border-primary/50' : 'border-white/20 hover:border-white/30'
              }`}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".txt,.json,.csv,.pdf,.png,.jpg,.jpeg,.gif,.mp3,.mp4,.doc,.docx,.xls,.xlsx,.zip"
              />
              
              {file ? (
                <div>
                  <div className="flex items-center justify-center mb-4">
                    <FileText size={32} className="text-primary" />
                  </div>
                  <p className="text-lg font-medium text-white">{file.name}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button 
                    className="mt-4 text-sm text-primary hover:text-primary/80 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center mb-4">
                    <Upload size={32} className="text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-white">
                    Drag and drop your file here
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    or click to browse (max 50MB)
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Supported: TXT, JSON, CSV, PDF, Images, Audio, Video, Documents, Archives
                  </p>
                </>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <Button 
                onClick={() => setStep(2)} 
                disabled={!file}
                icon={<ArrowRight size={16} />}
              >
                Continue
              </Button>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="p-6">
            <h2 className="text-xl font-medium mb-4">Configure Your Data Token</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Token Name*
                </label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-gray-500"
                  placeholder="Enter a name for your data token"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-gray-500 h-24 resize-none"
                  placeholder="Describe your data (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-300">
                    Transaction Fee
                  </label>
                  <div className="flex items-center text-xs text-gray-400">
                    <Info size={12} className="mr-1" />
                    Higher fees = faster processing
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {feeOptions.map((option) => (
                    <div 
                      key={option.value}
                      className={`border rounded-md p-3 cursor-pointer transition-all ${
                        selectedFee === option.value 
                          ? 'border-primary bg-primary/10' 
                          : 'border-white/10 hover:border-white/30'
                      }`}
                      onClick={() => setSelectedFee(option.value)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {option.speed} • {option.time}
                          </div>
                        </div>
                        {selectedFee === option.value && (
                          <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <Check size={12} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-8">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              
              <Button 
                onClick={() => setStep(3)} 
                disabled={!name || !isConnected}
              >
                {!isConnected ? 'Connect Wallet' : 'Continue to Payment'}
              </Button>
            </div>
          </div>
        )}
        
        {step === 3 && !tokenResult && (
          <div className="p-6">
            <h2 className="text-xl font-medium mb-4">Payment & Upload</h2>
            
            <div className="mb-6">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <h3 className="font-medium">Upload Summary</h3>
                  <p className="text-sm text-gray-400 mt-1">File: {file?.name}</p>
                  <p className="text-sm text-gray-400">Size: {file ? (file.size / 1024 / 1024).toFixed(2) : '0'} MB</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-medium">{selectedFee} ETH</p>
                  <p className="text-xs text-gray-400">Upload Fee</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle size={16} className="text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-300">Payment Required</p>
                    <p className="text-xs text-gray-300 mt-1">
                      You need to pay {selectedFee} ETH testnet tokens to upload and tokenize your data. 
                      This fee covers Irys storage costs and creates your tradable data token.
                    </p>
                  </div>
                </div>
              </div>

              {paymentTxHash && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-start">
                    <Check size={16} className="text-green-400 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-300">Payment Confirmed</p>
                      <p className="text-xs text-gray-300 mt-1 font-mono">
                        Transaction: {paymentTxHash.slice(0, 10)}...{paymentTxHash.slice(-6)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setStep(2)}
              >
                Back
              </Button>
              
              <div className="flex gap-3">
                {!paymentTxHash && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Mock payment for demo - in production, integrate with wallet
                      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
                      setPaymentTxHash(mockTxHash);
                      setIsPaymentComplete(true);
                      toast({ 
                        title: 'Payment Simulated', 
                        description: 'In production, this would connect to your wallet' 
                      });
                    }}
                  >
                    Simulate Payment
                  </Button>
                )}
                
                <Button 
                  onClick={() => setIsConfirmationOpen(true)}
                  disabled={!paymentTxHash}
                >
                  Upload & Tokenize
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 4 && tokenResult && (
          <div className="p-6">
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-400 mb-4">
                <Check size={32} />
              </div>
              
              <h2 className="text-2xl font-medium mb-2">Upload Complete!</h2>
              <p className="text-gray-300 mb-6">
                Your data has been successfully uploaded and tokenized.
              </p>
              
              <GlassCard className="mb-6 p-6 mx-auto max-w-sm">
                <div className="text-left">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-400">Token ID</span>
                    <span className="text-sm font-mono bg-white/5 px-2 py-1 rounded">
                      {tokenResult.token.symbol}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-400">Name</span>
                    <span className="text-sm">{tokenResult.token.name}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-400">Status</span>
                    <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                      <Check size={12} className="mr-1" /> Confirmed
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-400">Contract</span>
                    <span className="text-sm font-mono">
                      {tokenResult.token.tokenAddress.slice(0, 8)}...
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Fee Paid</span>
                    <span className="text-sm">{selectedFee} ETH</span>
                  </div>
                </div>
              </GlassCard>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={resetForm}
                  variant="outline"
                  icon={<Upload size={16} />}
                >
                  Upload Another File
                </Button>
                
                <Button 
                  onClick={() => window.location.href = '/trade'}
                  icon={<BarChart2 size={16} />}
                >
                  Trade Your Token
                </Button>
              </div>

              {tokenResult.irysUrl && (
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-gray-300 mb-2">Your data is permanently stored on Irys:</p>
                  <a 
                    href={tokenResult.irysUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm break-all"
                  >
                    {tokenResult.irysUrl}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </GlassCard>
      
      {/* Info Card */}
      <GlassCard className="p-6 bg-blue-500/5 border-blue-500/20">
        <div className="flex">
          <div className="flex-shrink-0">
            <Info size={20} className="text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-400">What happens after upload?</h3>
            <div className="mt-2 text-sm text-gray-300">
              <p>
                When you upload your data and pay the fee, your file is stored on the Irys blockchain, and you receive a unique token (DATA token) representing ownership of that data. This token can be traded on our decentralized exchange, allowing you to monetize your data or acquire tokens representing other valuable data.
              </p>
            </div>
          </div>
        </div>
      </GlassCard>
      
      {/* Confirmation Modal */}
      {isConfirmationOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <GlassCard className="p-6">
              <h3 className="text-xl font-medium mb-4">Confirm Upload & Tokenization</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">File</span>
                  <span className="font-medium">{file?.name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Token Name</span>
                  <span className="font-medium">{name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Upload Fee</span>
                  <span className="font-medium">{selectedFee} ETH</span>
                </div>

                {paymentTxHash && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment Status</span>
                    <span className="text-green-400 font-medium">✓ Paid</span>
                  </div>
                )}
                
                <div className="border-t border-white/10 pt-4">
                  <div className="flex justify-between font-medium">
                    <span>Total Cost</span>
                    <span>{selectedFee} ETH</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    This creates a tradable data token with 1M supply at {selectedFee} ETH initial price
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setIsConfirmationOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                
                <Button 
                  onClick={() => {
                    setIsConfirmationOpen(false);
                    handleUpload();
                  }}
                  className="flex-1"
                  disabled={uploadMutation.isPending || !paymentTxHash}
                >
                  {uploadMutation.isPending ? (
                    <div className="flex items-center">
                      <Clock size={16} className="animate-spin mr-2" />
                      Uploading to Irys...
                    </div>
                  ) : !paymentTxHash ? (
                    'Payment Required'
                  ) : (
                    'Upload & Tokenize'
                  )}
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </div>
  );
}
