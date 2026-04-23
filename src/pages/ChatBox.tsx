import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Mic, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fake typing indicator (for demo)
  useEffect(() => {
    if (messages.length > 0) {
      setTyping(true);
      setTimeout(() => setTyping(false), 1500);
    }
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: input,
      sender: 'me',
      time: new Date().toLocaleTimeString()
    };

    setMessages([...messages, newMessage]);
    setInput('');

    // Auto reply (demo feature)
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: 'Thanks for your message! 🚀',
        sender: 'other',
        time: new Date().toLocaleTimeString()
      }]);
    }, 2000);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">

      {/* Header */}
      <div className="bg-white shadow p-4 flex justify-between items-center">
        <div>
          <h2 className="font-bold text-lg">Chat Support</h2>
          <p className="text-sm text-gray-500">Online</p>
        </div>
        <MoreVertical />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-xs p-3 rounded-2xl ${
              msg.sender === 'me'
                ? 'ml-auto bg-blue-500 text-white'
                : 'bg-white'
            }`}
          >
            <p>{msg.text}</p>
            <span className="text-xs opacity-70">{msg.time}</span>
          </motion.div>
        ))}

        {/* Typing Indicator */}
        {typing && (
          <div className="bg-white px-4 py-2 rounded-xl w-fit text-sm">
            typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white p-3 flex items-center gap-2 shadow">
        <button className="p-2 hover:bg-gray-200 rounded-full">
          <Paperclip size={20} />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded-full outline-none"
        />

        <button className="p-2 hover:bg-gray-200 rounded-full">
          <Mic size={20} />
        </button>

        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
