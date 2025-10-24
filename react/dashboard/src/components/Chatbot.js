import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, Send, X, Bot, User, AlertCircle } from 'lucide-react';
import azureOpenAIService from '../services/azureOpenAIService';

const Chatbot = ({ studentData, dashboardContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant for the Early Alert Analytics Dashboard. I can help you analyze student data, understand trends, and provide insights. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Check if Azure OpenAI is configured
    const configured = azureOpenAIService.isConfigured();
    setIsConfigured(configured);
    
    // Debug environment variables (only for development)
    console.log('Environment variables check:', {
      endpoint: !!process.env.REACT_APP_AZURE_OPENAI_ENDPOINT,
      apiKey: !!process.env.REACT_APP_AZURE_OPENAI_API_KEY,
      deploymentName: !!process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT_NAME,
      apiVersion: !!process.env.REACT_APP_AZURE_OPENAI_API_VERSION,
      endpointValue: process.env.REACT_APP_AZURE_OPENAI_ENDPOINT?.substring(0, 50) + '...',
      deploymentNameValue: process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT_NAME
    });
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Focus input when chatbot opens
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      let responseContent;
      
      if (!isConfigured) {
        responseContent = "I'm not fully configured yet. To enable AI responses, please set up your Azure OpenAI credentials in the .env file:\n\n• REACT_APP_AZURE_OPENAI_ENDPOINT\n• REACT_APP_AZURE_OPENAI_API_KEY\n• REACT_APP_AZURE_OPENAI_DEPLOYMENT_NAME\n\nFor now, I can suggest some common queries:\n• 'What are the top alert types?'\n• 'Which faculty has the most alerts?'\n• 'How is our resolution rate trending?'";
      } else {
        responseContent = await azureOpenAIService.sendMessage(
          userMessage.content,
          studentData,
          dashboardContext
        );
      }

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: responseContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${error.message}. Please try again or check your Azure OpenAI configuration.`,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
  };

  const formatMessage = (content) => {
    // Simple formatting for bullet points and line breaks
    return content.split('\n').map((line, index) => (
      <div key={index} className={line.startsWith('•') || line.startsWith('-') ? 'ml-4' : ''}>
        {line || <br />}
      </div>
    ));
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const closeChatbot = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Chat Button - Fixed Position */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <button
          onClick={toggleChatbot}
          className={`relative p-4 rounded-full shadow-xl transition-all duration-300 transform hover:scale-110 ${
            isOpen 
              ? 'bg-gray-600 hover:bg-gray-700' 
              : 'bg-blue-600 hover:bg-blue-700 animate-pulse'
          }`}
          title={isOpen ? 'Close Chat' : 'Open Chat'}
          style={{ 
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            zIndex: 9999
          }}
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <MessageCircle className="h-6 w-6 text-white" />
          )}
          {!isConfigured && !isOpen && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-bounce" />
          )}
          {/* Notification badge for new features */}
          {!isOpen && (
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">!</span>
            </div>
          )}
        </button>
      </div>

      {/* Chat Window - Traditional Website Style */}
      {isOpen && createPortal(
        <div 
          className="fixed bottom-24 right-6 z-[9998] w-80 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ 
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            zIndex: 9998
          }}
        >
          {/* Header - Traditional Chat Style */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">AI Assistant</h3>
                <p className="text-xs text-blue-100">
                  {isConfigured ? 'Online' : 'Setup needed'}
                </p>
              </div>
            </div>
            <button
              onClick={closeChatbot}
              className="text-white hover:text-blue-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                  {/* Avatar */}
                  <div className={`flex items-end gap-2 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : message.isError 
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-600 text-white'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : message.isError ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    
                    {/* Message Bubble */}
                    <div className={`px-4 py-3 rounded-2xl max-w-full shadow-sm ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : message.isError
                          ? 'bg-red-50 text-red-800 border border-red-200 rounded-bl-md'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                    }`}>
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {formatMessage(message.content)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Timestamp */}
                  <div className={`text-xs text-gray-500 mt-1 px-2 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%]">
                  <div className="flex items-end gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-600 text-white flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl bg-white border border-gray-200 rounded-bl-md shadow-sm">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - Traditional Style */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex items-end gap-2">
              <div className="flex-1 min-h-[40px] max-h-[100px] relative">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  rows={1}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 resize-none"
                  style={{ 
                    minHeight: '40px',
                    maxHeight: '100px'
                  }}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            
            {/* Quick Actions */}
            {!isLoading && messages.length <= 1 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {[
                  "What are the top alert types?",
                  "Show me faculty trends",
                  "Campus performance"
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(suggestion)}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Chatbot;
