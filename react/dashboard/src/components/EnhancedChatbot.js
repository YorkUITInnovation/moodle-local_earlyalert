import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User, AlertCircle, Brain, Sparkles, TrendingUp } from 'lucide-react';
import azureOpenAIService from '../services/azureOpenAIService';

const EnhancedChatbot = ({ studentData, dashboardContext, alertData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: '🌟 Hello! I\'m AURA (Analytics Understanding & Response Assistant), your AI-powered Early Alert Analytics companion. I can:\n\n• 🧠 Analyze student risk patterns\n• 📊 Provide predictive insights  \n• 🎯 Suggest intervention strategies\n• 📈 Generate trend reports\n• 🔍 Deep-dive into specific cases\n\nWhat would you like to explore today?',
      timestamp: new Date(),
      type: 'welcome',
      suggestions: [
        '🚨 Show me high-risk students',
        '📊 Analyze faculty trends',
        '🎯 Predict intervention success',
        '📈 Generate executive summary'
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateContextualPrompt = (userMessage) => {
    const alertSummary = alertData ? {
      total: alertData.length,
      high_priority: alertData.filter(a => a.priority === 'High').length,
      in_progress: alertData.filter(a => a.status === 'In Progress').length,
      resolved: alertData.filter(a => a.status === 'Resolved').length,
      faculties: [...new Set(alertData.map(a => a.faculty))],
      alert_types: [...new Set(alertData.map(a => a.alertType))]
    } : {};

    return `You are AURA (Analytics Understanding & Response Assistant), an AI expert in student success analytics and early intervention strategies. You have access to real-time data from York University's Early Alert system.

CURRENT DASHBOARD CONTEXT:
- Total Active Alerts: ${alertSummary.total || 0}
- High Priority Cases: ${alertSummary.high_priority || 0}
- In Progress: ${alertSummary.in_progress || 0}
- Resolved: ${alertSummary.resolved || 0}
- Active Faculties: ${alertSummary.faculties?.join(', ') || 'None'}
- Alert Types: ${alertSummary.alert_types?.join(', ') || 'None'}

CAPABILITIES:
🧠 Predictive Analytics: Analyze patterns and predict outcomes
📊 Data Visualization: Explain chart insights and trends  
🎯 Intervention Strategy: Recommend evidence-based approaches
📈 Reporting: Generate executive summaries and insights
🔍 Deep Analysis: Investigate specific cases or patterns

User Question: "${userMessage}"

Provide actionable, data-driven insights with specific recommendations. Use emojis and clear formatting. If relevant, suggest follow-up questions or actions.`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);
    setIsThinking(true);

    try {
      const contextualPrompt = generateContextualPrompt(userMsg.content);
      
      // Simulate AI thinking with animated response
      setTimeout(() => setIsThinking(false), 2000);
      
      const response = await azureOpenAIService.getChatCompletion([
        { role: 'system', content: contextualPrompt },
        { role: 'user', content: userMsg.content }
      ]);

      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        type: 'analysis'
      };

      setMessages(prev => [...prev, aiMsg]);

      // Generate contextual suggestions based on response
      const suggestions = generateSuggestions(userMsg.content, response);
      if (suggestions.length > 0) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now() + 2,
            role: 'assistant',
            content: '💡 Here are some follow-up actions you might consider:',
            timestamp: new Date(),
            type: 'suggestions',
            suggestions: suggestions
          }]);
        }, 1000);
      }

    } catch (error) {
      console.error('Enhanced chatbot error:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: '⚠️ I encountered an issue analyzing your request. Please check my configuration or try rephrasing your question.',
        timestamp: new Date(),
        type: 'error'
      }]);
    } finally {
      setIsLoading(false);
      setIsThinking(false);
    }
  };

  const generateSuggestions = (userQuery, aiResponse) => {
    const suggestions = [];
    
    if (userQuery.toLowerCase().includes('risk') || userQuery.toLowerCase().includes('predict')) {
      suggestions.push('🎯 Create intervention plan for highest risk students');
      suggestions.push('📊 Show predictive accuracy metrics');
    }
    
    if (userQuery.toLowerCase().includes('faculty') || userQuery.toLowerCase().includes('trend')) {
      suggestions.push('📈 Compare faculty performance metrics');
      suggestions.push('🔍 Analyze seasonal patterns');
    }
    
    if (userQuery.toLowerCase().includes('alert') || userQuery.toLowerCase().includes('case')) {
      suggestions.push('⚡ Generate automated alert recommendations');
      suggestions.push('📋 Export detailed case analysis');
    }

    // Always include these general suggestions
    if (suggestions.length < 3) {
      suggestions.push('🚀 Generate executive dashboard summary');
      suggestions.push('🎓 Analyze student success patterns');
      suggestions.push('⚙️ Optimize intervention workflows');
    }

    return suggestions.slice(0, 3);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion.replace(/^[🎯📊📈🔍⚡📋🚀🎓⚙️]\s/, ''));
  };

  const ThinkingAnimation = () => (
    <div className="flex items-center space-x-2 text-blue-600 p-3 bg-blue-50 rounded-lg">
      <Brain className="w-4 h-4 animate-pulse" />
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
      </div>
      <span className="text-sm">AURA is analyzing...</span>
    </div>
  );

  const MessageContent = ({ message }) => {
    if (message.type === 'welcome') {
      return (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-blue-600 mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold">AURA - Analytics Assistant</span>
          </div>
          <div className="whitespace-pre-wrap">{message.content}</div>
          {message.suggestions && (
            <div className="grid grid-cols-1 gap-2 mt-3">
              {message.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-left p-2 bg-blue-50 hover:bg-blue-100 rounded border transition-colors text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (message.type === 'suggestions') {
      return (
        <div className="space-y-2">
          <div className="text-sm text-gray-600">{message.content}</div>
          <div className="grid grid-cols-1 gap-2">
            {message.suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-left p-2 bg-gray-50 hover:bg-gray-100 rounded border transition-colors text-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return <div className="whitespace-pre-wrap">{message.content}</div>;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 rounded-full shadow-xl transition-all duration-300 transform hover:scale-110 z-50"
        style={{ animation: 'pulse 2s infinite' }}
      >
        <div className="flex items-center space-x-2">
          <Brain className="w-6 h-6" />
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold animate-bounce">
          AI
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Brain className="w-5 h-5" />
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold">AURA Assistant</div>
            <div className="text-xs opacity-90">AI-Powered Analytics</div>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="hover:bg-white/20 p-1 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              <div className="flex items-center space-x-2 mb-1">
                {message.role === 'assistant' ? 
                  <Bot className="w-4 h-4 text-blue-600" /> : 
                  <User className="w-4 h-4" />
                }
                <span className="text-xs opacity-75">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <MessageContent message={message} />
            </div>
          </div>
        ))}
        
        {isThinking && <ThinkingAnimation />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask AURA about student analytics..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-all duration-200"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2 text-center">
          🧠 Powered by Azure OpenAI • Real-time Analytics
        </div>
      </div>
    </div>
  );
};

export default EnhancedChatbot;
