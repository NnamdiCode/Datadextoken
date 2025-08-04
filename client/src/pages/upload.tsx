import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Clock, FileText, Info, Upload, BarChart2, AlertCircle, Image, X, Copy, ExternalLink } from 'lucide-react';
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
  const [tokenId, setTokenId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [selectedFee, setSelectedFee] = useState('0.0002');
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [tokenResult, setTokenResult] = useState<any>(null);
  const [paymentTxHash, setPaymentTxHash] = useState('');
  const [uploadCost, setUploadCost] = useState<string>('');
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const [hasEnoughIrys, setHasEnoughIrys] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { account, isConnected } = useWallet();

  const dataCategories = [
    { value: 'financial', label: 'Financial Data', basePrice: 0.05 },
    { value: 'research', label: 'Research & Science', basePrice: 0.03 },
    { value: 'media', label: 'Media & Entertainment', basePrice: 0.02 },
    { value: 'marketing', label: 'Marketing & Analytics', basePrice: 0.025 },
    { value: 'healthcare', label: 'Healthcare & Medical', basePrice: 0.04 },
    { value: 'education', label: 'Educational Content', basePrice: 0.015 },
    { value: 'business', label: 'Business Intelligence', basePrice: 0.035 },
    { value: 'government', label: 'Government & Public', basePrice: 0.02 },
    { value: 'technology', label: 'Technology & Software', basePrice: 0.03 },
    { value: 'other', label: 'Other/General', basePrice: 0.01 }
  ];

  // Calculate dynamic pricing based on file size, type, and category
  const calculateTokenPrice = () => {
    if (!file || !category) return 0.01;
    
    const selectedCategory = dataCategories.find(cat => cat.value === category);
    const basePrice = selectedCategory?.basePrice || 0.01;
    
    // Size multiplier (larger files = higher value)
    const sizeInMB = file.size / (1024 * 1024);
    const sizeMultiplier = Math.max(1, Math.log10(sizeInMB + 1) * 0.5 + 1);
    
    // File type multiplier (structured data = higher value)
    const fileTypeMultipliers: { [key: string]: number } = {
      'application/json': 1.5,
      'text/csv': 1.4,
      'application/pdf': 1.2,
      'application/vnd.ms-excel': 1.3,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 1.3,
      'text/plain': 1.0,
      'image/': 0.8,
      'audio/': 0.9,
      'video/': 1.1,
      'default': 1.0
    };
    
    let typeMultiplier = fileTypeMultipliers['default'];
    for (const [type, multiplier] of Object.entries(fileTypeMultipliers)) {
      if (file.type.startsWith(type)) {
        typeMultiplier = multiplier;
        break;
      }
    }
    
    const finalPrice = basePrice * sizeMultiplier * typeMultiplier;
    return Math.max(0.005, Math.round(finalPrice * 1000) / 1000); // Min 0.005, round to 3 decimals
  };

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // First upload to Irys
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      const uploadResult = await uploadResponse.json();
      
      // Then create token on Irys VM
      const tokenResponse = await fetch('/api/irys/create-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: uploadResult.token.name,
          symbol: uploadResult.token.symbol,
          dataHash: uploadResult.token.irysTransactionId,
          metadata: JSON.stringify({
            description: uploadResult.token.description,
            category: uploadResult.token.category,
            fileSize: uploadResult.token.fileSize,
            fileType: uploadResult.token.fileType,
            fileName: uploadResult.token.fileName,
            imageUrl: uploadResult.token.imageUrl,
          }),
          creatorAddress: account,
        }),
      });
      
      if (!tokenResponse.ok) {
        const error = await tokenResponse.json();
        throw new Error(error.message || 'Token creation failed');
      }
      
      const tokenResult = await tokenResponse.json();
      
      return {
        ...uploadResult,
        irysTransaction: tokenResult.irysTransaction,
        tokenAddress: tokenResult.tokenAddress,
        transactionHash: tokenResult.transactionHash,
      };
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
      
      // Check file size (100MB limit)
      if (selectedFile.size > 100 * 1024 * 1024) {
        toast({ 
          title: 'File too large', 
          description: 'Maximum file size is 100MB',
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
    setTokenId('');
    setName('');
    setDescription('');
    setCategory('');
    setSelectedFee('0.0002');
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
    formData.append('tokenId', tokenId);
    formData.append('name', name);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('creatorAddress', account);
    formData.append('calculatedPrice', calculateTokenPrice().toString());
    
    uploadMutation.mutate(formData);
  };
  
  const feeOptions = [
    { value: '0.0001', label: '0.0001 IRYS', speed: 'Slow', time: '~30 min' },
    { value: '0.0002', label: '0.0002 IRYS', speed: 'Standard', time: '~5 min' },
    { value: '0.0005', label: '0.0005 IRYS', speed: 'Fast', time: '~1 min' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-4">Upload & Tokenize Your Data</h1>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Convert your data into tradable tokens on the Irys blockchain. Set metadata, pay a small fee, and receive a unique token.
        </p>
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
                    or click to browse (max 100MB)
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
                  Token ID*
                </label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-gray-500"
                  placeholder="Enter token ID (max 10 letters)"
                  value={tokenId}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                    if (value.length <= 10) {
                      setTokenId(value);
                    }
                  }}
                  maxLength={10}
                />
                <p className="text-xs text-gray-400 mt-1">{tokenId.length}/10 characters</p>
              </div>
              
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
                  placeholder="Describe your data"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Data Category*
                </label>
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-white"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="" className="bg-gray-800">Select a category</option>
                  {dataCategories.map((cat) => (
                    <option key={cat.value} value={cat.value} className="bg-gray-800">
                      {cat.label} (Base: {cat.basePrice} IRYS)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Category affects token pricing. Structured data types command higher prices.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Token Image (Optional)
                </label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                    imageFile ? 'border-green-500/50 bg-green-500/5' : 'border-white/20 hover:border-white/30'
                  }`}
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <input
                    id="image-upload"
                    type="file"
                    className="hidden"
                    onChange={handleImageChange}
                    accept="image/*"
                  />
                  
                  {imageFile ? (
                    <div className="flex items-center justify-center space-x-3">
                      <Image size={20} className="text-green-400" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">{imageFile.name}</p>
                        <p className="text-xs text-gray-400">
                          {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button 
                        className="text-red-400 hover:text-red-300 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageFile(null);
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Image size={20} className="text-gray-400" />
                      <span className="text-sm text-gray-400">Click to add token image (max 10MB)</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Add a visual representation for your data token. Supports JPG, PNG, GIF, WebP, SVG.
                </p>
              </div>
              
              {category && file && (
                <div className="border border-blue-500/30 bg-blue-500/10 rounded-md p-4">
                  <div className="flex items-center mb-2">
                    <Info size={16} className="text-blue-400 mr-2" />
                    <span className="text-sm font-medium text-blue-300">Calculated Token Price</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-300">
                    <div className="flex justify-between">
                      <span>Base price ({dataCategories.find(c => c.value === category)?.label}):</span>
                      <span>{dataCategories.find(c => c.value === category)?.basePrice} IRYS</span>
                    </div>
                    <div className="flex justify-between">
                      <span>File size ({(file.size / (1024 * 1024)).toFixed(2)} MB):</span>
                      <span>×{(Math.max(1, Math.log10(file.size / (1024 * 1024) + 1) * 0.5 + 1)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>File type ({file.type || 'unknown'}):</span>
                      <span>×{file.type.startsWith('application/json') ? '1.5' : file.type.startsWith('text/csv') ? '1.4' : '1.0'}</span>
                    </div>
                    <div className="border-t border-blue-500/30 pt-1 mt-2">
                      <div className="flex justify-between font-medium text-blue-300">
                        <span>Final Token Price:</span>
                        <span>{calculateTokenPrice()} IRYS</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
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
                disabled={!tokenId || !name || !description || !category || !isConnected}
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
                  <p className="text-lg font-medium">{calculateTokenPrice()} IRYS</p>
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
                      You need to pay {calculateTokenPrice()} IRYS testnet tokens to upload and tokenize your data. 
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
                      {tokenResult.token.name}
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
                      0x{tokenResult.token.irysTransactionId.slice(0, 8)}...
                    </span>
                  </div>
                  
                  <div className="mb-4 border-t border-white/10 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Irys Transaction</span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(tokenResult.token.irysTransactionId);
                            toast({ title: 'Transaction ID copied!' });
                          }}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                          title="Copy transaction ID"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs font-mono text-gray-300 break-all mb-2">
                      {tokenResult.token.irysTransactionId}
                    </div>
                    <a
                      href={`https://devnet.irys.xyz/tx/${tokenResult.token.irysTransactionId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <ExternalLink size={12} className="mr-1" />
                      View on Irys Devnet Explorer
                    </a>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Fee Paid</span>
                    <span className="text-sm">0.005 IRYS</span>
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

              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center mb-2">
                  <Info size={16} className="text-blue-400 mr-2" />
                  <p className="text-sm text-blue-300 font-medium">Data Permanently Stored on Irys Blockchain</p>
                </div>
                <p className="text-xs text-gray-300 mb-3">
                  Your data is now immutably stored on the Irys blockchain with guaranteed availability. 
                  Use the transaction ID above to verify and access your data at any time.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <a 
                    href={`https://devnet.irys.xyz/tx/${tokenResult.token.irysTransactionId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded text-xs text-blue-300 transition-colors"
                  >
                    <ExternalLink size={12} className="mr-1" />
                    View Transaction
                  </a>
                  <a 
                    href={`https://devnet.irys.xyz/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded text-xs text-blue-300 transition-colors"
                  >
                    <ExternalLink size={12} className="mr-1" />
                    Irys Devnet Explorer
                  </a>
                </div>
              </div>
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
              <h3 className="text-xl font-medium mb-4 shiny-text">Confirm Upload & Tokenization</h3>
              
              <div className="space-y-4 mb-6">
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Token Name</span>
                  <span className="font-medium">{name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Upload Fee</span>
                  <span className="font-medium">{calculateTokenPrice()} IRYS</span>
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
                    <span>{calculateTokenPrice()} IRYS</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    This creates a tradable data token with 1 billion supply at {calculateTokenPrice()} IRYS initial price
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
