import React, { useState, useRef, useEffect } from 'react';
import { X, Send, User, Bot, MessageCircle, Sparkles, ShoppingBag } from 'lucide-react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const Buy2SellChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hello! I'm your Buy2Sell AI assistant. I can help you find products, check order status, or answer questions about our marketplace. How can I assist you today?",
      sender: 'bot',
      timestamp: new Date(),
      type: 'text_only'
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Send request to our backend instead of Google directly
      const response = await api.post('/chatbot/ai/query', {
        q: userMessage.text
      });

      const data = response.data;

      const botResponse = {
        id: (Date.now() + 1).toString(),
        text: data.message,
        sender: 'bot',
        timestamp: new Date(),
        type: data.type || 'text_only',
        products: data.products || []
      };

      setMessages((prev) => [...prev, botResponse]);

    } catch (error) {
      console.error("Chatbot Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "I'm having trouble connecting to the server. Please check your internet connection or try again later.",
          sender: "bot",
          timestamp: new Date(),
          type: 'text_only'
        },
      ]);
    }
    finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Render a product card inside the chat
  const renderProduct = (product) => (
    <div
      key={product.id}
      className="bg-white border border-gray-200 rounded-lg p-3 my-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer min-w-[200px] max-w-[220px]"
      onClick={() => {
        setIsOpen(false);
        navigate(`/product-detail?id=${product.id}`);
      }}
    >
      <div className="h-24 w-full bg-gray-100 rounded-md mb-2 overflow-hidden relative">
        <img
          src={product.imageUrl || '/placeholder.svg'}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }}
        />
        {product.status === 'out-of-stock' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">
            OUT OF STOCK
          </div>
        )}
      </div>
      <h4 className="font-semibold text-gray-800 text-sm truncate" title={product.name}>{product.name}</h4>
      <div className="flex justify-between items-center mt-1">
        <span className="text-green-600 font-bold text-sm">PKR {product.price}</span>
        <span className="text-xs text-gray-400 capitalize">{product.listingType}</span>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`fixed bottom-6 left-6 z-50 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 ${isOpen ? 'hidden' : 'block'}`}
      >
        <MessageCircle className="w-6 h-6 text-white" />
        <div className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-bounce">AI</div>
      </button>

      {isOpen && (
        <div className="fixed bottom-6 left-6 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden border border-green-100 animate-fade-in-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white rounded-t-2xl shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-inner">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg tracking-wide">Buy2Sell Assistant</h3>
                  <div className="flex items-center gap-1.5 opacity-90">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-200 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-300"></span>
                    </span>
                    <p className="text-xs font-medium">Online & Ready to Help</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-200">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[85%] ${message.sender === 'user' ? 'order-1' : 'order-2'}`}>
                  <div className={`p-3.5 rounded-2xl shadow-sm relative ${message.sender === 'user'
                    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white rounded-tr-none'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                    }`}>
                    {/* Message Text */}
                    <div className="flex items-start gap-2">
                      {message.sender === 'bot' && <Bot size={16} className="mt-1 text-green-600 shrink-0" />}
                      <div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>

                        {/* Render Products if available */}
                        {message.type === 'products' && message.products && message.products.length > 0 && (
                          <div className="mt-3 grid grid-cols-1 gap-2">
                            {message.products.map(renderProduct)}
                            <button
                              onClick={() => { setIsOpen(false); navigate('/search'); }}
                              className="w-full text-center text-xs text-green-600 font-semibold hover:underline mt-1"
                            >
                              View all results
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <p className={`text-[10px] mt-1 text-right ${message.sender === 'user' ? 'text-green-100' : 'text-gray-400'}`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>

                {/* Avatar Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm mt-auto mx-2 ${message.sender === 'user' ? 'bg-gray-200 order-2' : 'bg-green-100 order-1'
                  }`}>
                  {message.sender === 'user' ? (
                    <User size={14} className="text-gray-500" />
                  ) : (
                    <Bot size={14} className="text-green-600" />
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start animate-pulse">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 shadow-sm mr-2 mt-auto">
                  <Bot size={14} className="text-green-600" />
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white p-3 border-t border-gray-100">
            <div className="relative flex items-end gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-500 transition-all">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about products, shipping, returns..."
                className="flex-1 bg-transparent resize-none border-none focus:ring-0 text-sm max-h-24 py-2 px-1 text-gray-700 placeholder-gray-400"
                rows={1}
                disabled={isTyping}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white p-2.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:shadow-none disabled:translate-y-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 text-center flex items-center justify-center gap-1.5 text-[10px] text-gray-400 font-medium tracking-wide">
              <Sparkles size={10} className="text-green-500" />
              <span>AI ASSISTANT POWERED BY GEMINI</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Buy2SellChatbot;
