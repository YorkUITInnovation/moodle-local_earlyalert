import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Send, X, Bot, User, AlertCircle, Brain, Sparkles } from 'lucide-react';
import azureOpenAIService from '../services/azureOpenAIService';

// Simple markdown renderer for AI responses
const MarkdownRenderer = ({ content }) => {
  const renderMarkdown = (text) => {
    // First, normalize the text by handling different line break patterns
    let normalizedText = text
      // Convert Windows line endings to Unix
      .replace(/\r\n/g, '\n')
      // Handle cases where bullet points are immediately after text without double newlines
      .replace(/([.!?])\s*\n- /g, '$1\n\n- ')
      // Handle cases where headers are immediately after text
      .replace(/([.!?])\s*\n(#{1,3}\s)/g, '$1\n\n$2')
      // Ensure bullet lists have proper spacing
      .replace(/\n- /g, '\n- ')
      .replace(/\n\* /g, '\n* ');
    
    // Split by double newlines to get paragraphs, but also handle single newlines followed by bullets
    const sections = normalizedText.split(/\n\s*\n/);
    
    return sections.map((section, sIndex) => {
      // Skip empty sections
      if (!section.trim()) return null;
      
      // Check if it's a header
      if (section.startsWith('###')) {
        return (
          <h3 key={sIndex} className="text-lg font-semibold text-gray-900 mb-2 mt-4">
            {section.replace(/^### /, '')}
          </h3>
        );
      }
      
      if (section.startsWith('##')) {
        return (
          <h2 key={sIndex} className="text-xl font-semibold text-gray-900 mb-3 mt-4">
            {section.replace(/^## /, '')}
          </h2>
        );
      }
      
      if (section.startsWith('#')) {
        return (
          <h1 key={sIndex} className="text-2xl font-bold text-gray-900 mb-3 mt-4">
            {section.replace(/^# /, '')}
          </h1>
        );
      }
      
      // Check if this section contains bullet points or numbered lists
      const lines = section.split('\n').filter(line => line.trim());
      const listItems = [];
      const regularLines = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('- ') || line.startsWith('* ')) {
          listItems.push(line.replace(/^[\-\*] /, ''));
        } else if (line.match(/^\d+\. /)) {
          listItems.push(line.replace(/^\d+\. /, ''));
        } else {
          // If we have accumulated list items, render them first
          if (listItems.length > 0) {
            regularLines.push(
              <ul key={`list-${i}`} className="list-disc list-inside mb-3 space-y-1">
                {listItems.map((item, itemIndex) => (
                  <li key={itemIndex} className="ml-4">
                    {formatInlineMarkdown(item)}
                  </li>
                ))}
              </ul>
            );
            listItems.length = 0; // Clear the array
          }
          regularLines.push(line);
        }
      }
      
      // Handle any remaining list items
      if (listItems.length > 0) {
        regularLines.push(
          <ul key={`list-end`} className="list-disc list-inside mb-3 space-y-1">
            {listItems.map((item, itemIndex) => (
              <li key={itemIndex} className="ml-4">
                {formatInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        );
      }
      
      // If we only have React elements (lists), return them
      if (regularLines.every(line => React.isValidElement(line))) {
        return (
          <div key={sIndex} className="mb-3">
            {regularLines}
          </div>
        );
      }
      
      // Process regular text lines
      const textContent = regularLines.filter(line => typeof line === 'string').join(' ');
      const reactElements = regularLines.filter(line => React.isValidElement(line));
      
      return (
        <div key={sIndex} className="mb-3">
          {textContent && (
            <p className="mb-2 leading-relaxed">
              {formatInlineMarkdown(textContent)}
            </p>
          )}
          {reactElements}
        </div>
      );
    }).filter(Boolean);
  };
  
  const formatInlineMarkdown = (text) => {
    // Handle bold text
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Handle italic text
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Handle inline code
    text = text.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>');
    
    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  };
  
  return (
    <div className="prose prose-sm max-w-none">
      {renderMarkdown(content)}
    </div>
  );
};

const ConversationalAnalytics = ({ 
  isOpen, 
  setIsOpen, 
  studentData, 
  dashboardContext, 
  currentFilters,
  metrics 
}) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Hello! I\'m your AI Analytics Assistant for the Early Alert Dashboard. I can help you analyze student data, understand trends, and provide insights based on your current dashboard data. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Suggested questions based on dashboard context
  const suggestedQuestions = [
    // Local Analytics - Fast queries (guaranteed to work)
    "How many students total?",
    "How many alerts total?", 
    "How many students have high priority alerts?",
    "How many students have medium priority alerts?",
    "Quick summary",
    "Show stats",
    // AI Analytics - Complex queries  
    "What are the key insights from the current data?",
    "What recommendations do you have for improving outcomes?"
  ];

  useEffect(() => {
    // Check if Azure OpenAI is configured (async)
    const checkConfiguration = async () => {
      const configured = await azureOpenAIService.isConfigured();
      setIsConfigured(configured);
    };

    checkConfiguration();
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

  const handleSendMessage = async (messageText = null) => {
    const message = messageText || inputMessage.trim();
    if (!message || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Enhanced context with current filters and metrics
      const enhancedContext = {
        ...dashboardContext,
        currentFilters,
        metrics,
        timestamp: new Date().toISOString()
      };
      
      // Use the integrated service that handles both local and AI analytics
      const responseContent = await azureOpenAIService.sendMessage(
        message,
        studentData,
        enhancedContext
      );

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

  const handleSuggestedQuestion = (question) => {
    handleSendMessage(question);
  };

  if (!isOpen) return null;

  console.log('ConversationalAnalytics rendering with isOpen:', isOpen);

  return createPortal(
    <div 
      className="fixed z-50"
      style={{ 
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col"
        style={{ 
          height: '85vh',
          margin: '0 auto',
          marginTop: '20px',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-gradient-to-r from-[#E31837] to-[#B91C1C] text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-white bg-opacity-20 rounded-full">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">AI Analytics Assistant</h2>
              <p className="text-xs text-red-100">
                {isConfigured ? 'Ask questions about your dashboard data' : 'Configuration needed'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Context Info */}
        <div className="px-4 py-2 bg-gray-50 border-b text-xs">
          <div className="flex items-center gap-2 text-gray-600">
            <Sparkles className="w-3 h-3" />
            <span>
              Analyzing {dashboardContext?.filteredAlerts?.length || 0} alerts across {metrics?.uniqueStudents || 0} students
              {currentFilters && Object.values(currentFilters).some(f => f) && ' (filtered data)'}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-[#E31837] text-white' 
                    : message.isError 
                      ? 'bg-red-100 text-red-600' 
                      : 'bg-blue-100 text-blue-600'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : message.isError ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div className={`rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-[#E31837] text-white'
                    : message.isError
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : 'bg-gray-100 text-gray-800'
                }`}>
                  <div className="text-sm">
                    {message.role === 'assistant' && !message.isError ? (
                      <MarkdownRenderer content={message.content} />
                    ) : (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    )}
                  </div>
                  <div className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-red-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
                    <span className="text-sm">Analyzing your data...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="p-4 border-t bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Try asking:</h3>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.slice(0, 4).map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="text-xs bg-white hover:bg-gray-100 text-gray-700 px-3 py-1 rounded-full border border-gray-200 transition-colors"
                  disabled={isLoading}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t bg-white rounded-b-lg">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your dashboard data..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E31837] focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-2 bg-[#E31837] text-white rounded-lg hover:bg-[#B91C1C] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
          
          {!isConfigured && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Azure OpenAI not configured. Check your .env file.
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConversationalAnalytics;
