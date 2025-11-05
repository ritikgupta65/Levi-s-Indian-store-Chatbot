
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Send, Phone, Paperclip } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  isConnected: boolean;
  startCall: () => void;
  stopCall: () => void;
  isTryOnMode?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled,
  isConnected,
  startCall,
  stopCall,
  isTryOnMode = false,
}) => {
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [tryOnImages, setTryOnImages] = useState<string[]>([]);
  const { theme } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCallClick = () => {
    if (isConnected) {
      stopCall();
    } else {
      startCall();
    }
  };

  // const handleAttachmentClick = () => {
  //   console.log('Attachment button clicked');
  // };


const fileInputRef = useRef<HTMLInputElement>(null);

const handleAttachmentClick = () => {
  fileInputRef.current?.click();
};

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      
      if (isTryOnMode) {
        // Try-On mode: Add to array (max 2 images)
        if (tryOnImages.length < 2) {
          setTryOnImages(prev => [...prev, base64]);
        }
      } else {
        // Regular mode: Single image
        setSelectedImage(base64);
      }
    };
    reader.readAsDataURL(file);
  }
  // Reset file input
  e.target.value = '';
};

const removeImage = (index?: number) => {
  if (isTryOnMode && index !== undefined) {
    setTryOnImages(prev => prev.filter((_, i) => i !== index));
  } else {
    setSelectedImage(null);
  }
};



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isTryOnMode) {
      // Try-On mode: Require exactly 2 images
      if (tryOnImages.length === 2 && !disabled) {
        let finalMessage = 'Try-On Request:\n';
        tryOnImages.forEach((img, index) => {
          const label = index === 0 ? 'Your Photo' : 'Clothing Item';
          finalMessage += `<br/><strong>${label}:</strong><br/><img src="${img}" alt="${label}" class="max-w-[200px] max-h-[200px] rounded-lg mb-2" />`;
        });
        
        onSendMessage(finalMessage);
        setTryOnImages([]);
      }
    } else {
      // Regular mode: Text or image
      if ((message.trim() || selectedImage) && !disabled) {
        let finalMessage = '';
        
        // Add image if selected
        if (selectedImage) {
          finalMessage += `<img src="${selectedImage}" alt="uploaded" class="max-w-[200px] max-h-[200px] rounded-lg mb-2" />`;
        }
        
        // Add text if provided
        if (message.trim()) {
          finalMessage += selectedImage ? `<br/>${message.trim()}` : message.trim();
        }
        
        onSendMessage(finalMessage);
        setMessage('');
        setSelectedImage(null);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="p-3 bg-gradient-to-r from-gray-700/20 to-black/20 backdrop-blur-md border-t border-gray-600/30 rounded-b-[inherit]">
      {/* Try-On Mode Images Preview - Compact Height & Right-Aligned */}
      {isTryOnMode && tryOnImages.length > 0 && (
        <div className="mb-1 flex justify-end">
          <div className="w-1/2 p-1.5 bg-white/40 backdrop-blur-md rounded-md border border-gray-600/30">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-medium text-gray-800" style={{ fontSize: '10px' }}>Try-On Images ({tryOnImages.length}/2)</h3>
              <span className="text-xs text-gray-600" style={{ fontSize: '10px' }}>
                {tryOnImages.length < 2 ? `Upload ${2 - tryOnImages.length} more` : 'Ready!'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {tryOnImages.map((img, index) => (
                <div key={index} className="relative">
                  <img 
                    src={img} 
                    alt={index === 0 ? "Your Photo" : "Clothing Item"} 
                    className="w-full h-8 object-cover rounded-sm border border-gray-300"
                  />
                  <div className="absolute -top-0.5 -right-0.5">
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="w-3 h-3 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                      style={{ fontSize: '8px' }}
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 text-center leading-tight" style={{ fontSize: '9px' }}>
                    {index === 0 ? "Your Photo" : "Clothing"}
                  </p>
                </div>
              ))}
              {tryOnImages.length < 2 && (
                <div className="border border-dashed border-gray-300 rounded-sm h-8 flex items-center justify-center">
                  <span className="text-xs text-gray-500" style={{ fontSize: '9px' }}>{tryOnImages.length === 0 ? 'Photo' : 'Clothing'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Regular Mode Image Preview */}
      {!isTryOnMode && selectedImage && (
        <div className="mb-3 p-3 bg-gray-100/90 backdrop-blur-md rounded-lg border border-gray-300/50">
          <div className="flex items-start space-x-3">
            <img 
              src={selectedImage} 
              alt="Preview" 
              className="w-16 h-16 object-cover rounded-lg border border-gray-300"
            />
            <div className="flex-1">
              <p className="text-sm text-gray-700 font-medium">Image attached</p>
              <p className="text-xs text-gray-500">You can add text below and send both together</p>
            </div>
            <button
              type="button"
              onClick={() => removeImage()}
              className="text-gray-500 hover:text-red-500 text-sm font-medium transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="w-full">
        {isTryOnMode ? (
          /* Try-On Mode: Compact design */
          <div className="relative w-full">
            <div className="w-full p-3 bg-white/40 backdrop-blur-md border border-gray-600/30 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-800">Virtual Try-On</p>
                  <p className="text-xs text-gray-600">
                    {tryOnImages.length === 0 && "Upload 2 images to start"}
                    {tryOnImages.length === 1 && "Upload 1 more image"}
                    {tryOnImages.length === 2 && "Ready to generate try-on result!"}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleAttachmentClick}
                    disabled={tryOnImages.length >= 2}
                    className={`p-2 rounded-full border transition-all duration-300 hover:scale-110 shadow-sm ${
                      tryOnImages.length >= 2
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-600/30'
                        : 'bg-[#1a1f27] hover:bg-[#2a2f37] border-[#1a1f27] text-white hover:shadow-md'
                    }`}
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button
                    type="submit"
                    disabled={tryOnImages.length !== 2 || disabled}
                    className={`px-3 py-1.5 rounded-full transition-all duration-300 font-medium text-xs border ${
                      tryOnImages.length === 2 && !disabled
                        ? 'bg-[#1a1f27] hover:bg-[#2a2f37] text-white border-black shadow-sm hover:shadow-md'
                        : 'bg-gray-300 text-gray-600 cursor-not-allowed border-gray-600'
                    }`}
                  >
                    Generate Try-On
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Regular Mode: Text input with attachment */
          <div className="relative w-full">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={disabled}
              className="w-full p-3 pr-28 bg-white/40 backdrop-blur-md border border-gray-600/30 rounded-lg text-gray-900 placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-gray-600/50 focus:border-gray-600/50 transition-all duration-200 min-h-[48px] max-h-24 scrollbar-hide shadow-sm"
              rows={1}
            />
          
            {/* Compact Buttons inside the input */}
            <div className="absolute right-1.5 bottom-1.5 flex items-center space-x-1.5">
              <button
                type="button"
                onClick={handleCallClick}
                className={`p-2 rounded-full border transition-all duration-300 hover:scale-110 shadow-sm ${
                  isConnected 
                    ? 'bg-red-500 hover:bg-red-600 border-red-400/50 text-white' 
                    : 'bg-gradient-to-r from-gray-700 to-black hover:from-gray-800 hover:to-black border-gray-600/50 text-white hover:shadow-md'
                }`}
              >
                <Phone className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={handleAttachmentClick}
                className="p-2 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-black border border-gray-600/50 hover:border-gray-700/50 transition-all duration-300 text-white hover:scale-110 shadow-sm hover:shadow-md"
              >
                <Paperclip className="w-3 h-3" />
              </button>

              <button
                type="submit"
                disabled={(!message.trim() && !selectedImage) || disabled}
                className={`p-2 rounded-full transition-all duration-300 hover:scale-110 shadow-sm ${
                  (message.trim() || selectedImage) && !disabled
                    ? 'bg-gradient-to-r from-gray-700 to-black backdrop-blur-md border border-gray-600/50 text-white hover:from-gray-800 hover:to-black hover:shadow-md'
                    : 'bg-gray-200/50 text-gray-600 cursor-not-allowed border border-gray-600/30'
                }`}
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Hidden file input for both modes */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </form>
    </div>
  );
};

export default MessageInput;
