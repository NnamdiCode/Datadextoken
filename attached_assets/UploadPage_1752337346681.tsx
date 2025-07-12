import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Check, ChevronDown, Clock, FileText, Info, Upload } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import { toast } from 'react-toastify';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFee, setSelectedFee] = useState('0.05');
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [tokenId, setTokenId] = useState('');
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const resetForm = () => {
    setFile(null);
    setStep(1);
    setName('');
    setDescription('');
    setSelectedFee('0.05');
    setTokenId('');
  };
  
  const handleUpload = () => {
    if (!file || !name) return;
    
    setUploading(true);
    
    // Simulate upload process
    setTimeout(() => {
      setUploading(false);
      setTokenId('DATA' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'));
      setStep(3);
      toast.success('Your data has been successfully uploaded and tokenized!');
    }, 2500);
  };
  
  const feeOptions = [
    { value: '0.02', label: '0.02 IRYS', speed: 'Slow', time: '~30 min' },
    { value: '0.05', label: '0.05 IRYS', speed: 'Standard', time: '~5 min' },
    { value: '0.1', label: '0.1 IRYS', speed: 'Fast', time: '~1 min' }
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
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
              step === i 
                ? 'bg-blue-500 text-white' 
                : step > i 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white/10 text-gray-400'
            }`}>
              {step > i ? <Check size={18} /> : i}
            </div>
            <span className={`mt-2 text-xs ${step >= i ? 'text-white' : 'text-gray-400'}`}>
              {i === 1 ? 'Upload' : i === 2 ? 'Configure' : 'Complete'}
            </span>
            
            {/* Connector line */}
            {i < 3 && (
              <div className="absolute top-5 left-10 w-full h-[2px] bg-white/10">
                <div 
                  className={`h-full bg-blue-500 transition-all duration-500 ${
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
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                file ? 'border-blue-500/50' : 'border-white/20 hover:border-white/30'
              } transition-colors cursor-pointer`}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              
              {file ? (
                <div>
                  <div className="flex items-center justify-center mb-4">
                    <FileText size={32} className="text-blue-400" />
                  </div>
                  <p className="text-lg font-medium text-white">{file.name}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button 
                    className="mt-4 text-sm text-blue-400 hover:text-blue-300"
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
                  className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-gray-500"
                  placeholder="Enter a name for your data token"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-gray-500 h-24 resize-none"
                  placeholder="Describe your data (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                          ? 'border-blue-500 bg-blue-500/10' 
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
                          <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
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
                onClick={() => setIsConfirmationOpen(true)} 
                disabled={!name}
              >
                Upload & Pay
              </Button>
            </div>
          </div>
        )}
        
        {step === 3 && (
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
                    <span className="text-sm font-mono bg-white/5 px-2 py-1 rounded">{tokenId}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-400">Name</span>
                    <span className="text-sm">{name}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-400">Status</span>
                    <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                      <Check size={12} className="mr-1" /> Confirmed
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Fee Paid</span>
                    <span className="text-sm">{selectedFee} IRYS</span>
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
              <h3 className="text-xl font-medium mb-4">Confirm Upload</h3>
              
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
                  <span className="text-gray-400">Fee</span>
                  <span className="font-medium">{selectedFee} IRYS</span>
                </div>
                
                <div className="border-t border-white/10 pt-4">
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>{selectedFee} IRYS</span>
                  </div>
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
                  disabled={uploading}
                >
                  {uploading ? (
                    <div className="flex items-center">
                      <Clock size={16} className="animate-spin mr-2" />
                      Processing...
                    </div>
                  ) : (
                    'Confirm & Pay'
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
