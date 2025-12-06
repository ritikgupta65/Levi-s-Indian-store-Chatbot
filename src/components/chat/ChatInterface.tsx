
import { useState, useEffect } from 'react';
import WelcomeScreenWidget from './WelcomeScreenWidget';
import ChatWindow from './ChatWindow';
import NavigationBar from './NavigationBar';
import ContactForm from './ContactForm';
import { Message, ChatState } from '@/types/chat';
import { useVapi } from '@/hooks/useVapi';

const ChatInterface = () => {
  const [chatState, setChatState] = useState<ChatState>('welcome');
  const [regularMessages, setRegularMessages] = useState<Message[]>([]);
  const [tryOnMessages, setTryOnMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTryOnMode, setIsTryOnMode] = useState(false);
  
  // Get current messages based on mode
  const messages = isTryOnMode ? tryOnMessages : regularMessages;
  const setMessages = isTryOnMode ? setTryOnMessages : setRegularMessages;

  const apiKey = '4990af9d-ee12-4591-a103-2810f3d78126';
  const assistantId = 'ea3b9464-bb40-43ec-a4d0-6c9728923143';
  const { isConnected, isSpeaking, startCall, stopCall, transcript, clearTranscript } = useVapi(apiKey, assistantId);

  const startChat = (initialMessage?: string) => {
    if (initialMessage === 'Try-On') {
      // Try-On mode: Switch to Try-On and load its history
      setIsTryOnMode(true);
      setChatState('chatting');
      
      // Only add welcome message if Try-On history is empty
      if (tryOnMessages.length === 0) {
        const tryOnWelcomeMessage: Message = {
          id: Date.now().toString(),
          content: '👕 Welcome to Virtual Try-On! 📸\n\nUpload two images to see how clothes look on you:\n\n1️⃣ **Your photo** - A clear photo of yourself\n2️⃣ **Clothing item** - The garment you want to try on\n\nThen click send and I\'ll show you how it looks!',
          sender: 'bot',
          timestamp: new Date(),
        };
        setTryOnMessages([tryOnWelcomeMessage]);
      }
      return;
    }
    
    // Regular chat mode: Switch to regular chat and load its history
    setIsTryOnMode(false);
    setChatState('chatting');
    if (initialMessage) {
      handleSendMessage(initialMessage);
    }
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };

    // Add to appropriate message history based on current mode
    if (isTryOnMode) {
      setTryOnMessages((prev) => [...prev, userMessage]);
    } else {
      setRegularMessages((prev) => [...prev, userMessage]);
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('https://ritik-n8n-e9673da43cf4.herokuapp.com/webhook/327b7049-d402-4001-bd1a-d4a08a29f187', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.reply || 'Sorry, I couldn\'t understand that.',
        sender: 'bot',
        timestamp: new Date(),
      };

      // Add to appropriate message history based on current mode
      if (isTryOnMode) {
        setTryOnMessages((prev) => [...prev, botMessage]);
      } else {
        setRegularMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Oops! Something went wrong. Try again later.',
        sender: 'bot',
        timestamp: new Date(),
      };

      // Add to appropriate message history based on current mode
      if (isTryOnMode) {
        setTryOnMessages((prev) => [...prev, errorMessage]);
      } else {
        setRegularMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const goHome = () => {
    setChatState('welcome');
    setIsTryOnMode(false);
  };

  const startNewChat = () => {
    // Clear only the current mode's history
    if (isTryOnMode) {
      setTryOnMessages([]);
    } else {
      setRegularMessages([]);
    }
    clearTranscript();
    setIsLoading(false);
  };

  return (
    // Outer wrapper holds the border and rounded corners
    <div className="h-full rounded-lg border border-gray-600/30">
      {/* Inner wrapper carries background + clipping so the border shows cleanly at corners */}
      <div className="h-full flex flex-col rounded-[inherit] overflow-hidden bg-white/40 backdrop-blur-md">
        <div className="flex-1 overflow-hidden">
        {chatState === 'welcome' ? (
          <div className="h-full flex flex-col">
            <div className="h-full flex-1 overflow-y-auto scrollbar-hide">
              <WelcomeScreenWidget onStartChat={startChat} />
            </div>
            {/* Navigation Bar only on welcome screen */}
            <div className="flex-shrink-0">
              <NavigationBar currentView={chatState} onNavigate={setChatState} />
            </div>
          </div>
        ) : chatState === 'form' ? (
          <ContactForm onGoHome={goHome} />
        ) : (
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onGoHome={goHome}
            onNewChat={startNewChat}
            isConnected={isConnected}
            transcript={transcript}
            startCall={startCall}
            stopCall={stopCall}
            isTryOnMode={isTryOnMode}
          />
        )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
