import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Send, Paperclip, Mic, Phone, Video, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { db } from '../firebase/config'; // ✅ Connected your config
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth'; // ✅ Added auth to know who is sending

export default function WorkerChatPage() {
  const { id: chatId } = useParams(); // ✅ Matches your routing
  const location = useLocation();
  const { user } = useAuth();

  const [worker, setWorker] = useState(location.state?.worker || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // 🔥 Real Firebase Fetch: Worker Info & Messages
  useEffect(() => {
    if (!chatId || !user) return;

    // 1. Fetch Chat Meta (Worker Info)
    const fetchChatMeta = async () => {
      if (!worker) {
        const chatSnap = await getDoc(doc(db, 'chats', chatId));
        if (chatSnap.exists()) {
          const data = chatSnap.data();
          setWorker({
            name: data.workerName || 'Service Provider',
            service: 'Professional Partner',
            online: true
          });
        }
      }
    };

    // 2. Real-time Messages Listener
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: doc.data().createdAt?.toDate().toLocaleTimeString() || 'Just now'
      }));
      setMessages(msgs);
    });

    fetchChatMeta();
    return () => unsub();
  }, [chatId, user]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user || !chatId) return;

    const text = input;
    setInput('');

    try {
      // 🔥 Firebase Production Send
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: text,
        sender: 'client',
        senderId: user.uid,
        createdAt: serverTimestamp()
      });

      // Update last message in main chat doc
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Send Error:", err);
    }
  };

  if (!worker) {
    return <div className="h-screen flex items-center justify-center">Loading Conversation...</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">

      {/* Header - Dynamic Worker Info */}
      <div className="bg-white shadow p-4 flex justify-between items-center z-10">
        <div>
          <h2 className="font-bold text-lg">{worker.name}</h2>
          <p className="text-sm text-gray-500">
            {worker.service} • {worker.online ? 'Online' : 'Offline'}
          </p>
        </div>

        <div className="flex gap-3 items-center text-gray-600">
          <Phone className="cursor-pointer hover:text-blue-500 w-5 h-5" />
          <Video className="cursor-pointer hover:text-blue-500 w-5 h-5" />
          <MoreVertical className="cursor-pointer" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-xs p-3 rounded-2xl shadow-sm ${
              msg.senderId === user?.uid
                ? 'ml-auto bg-blue-500 text-white rounded-tr-none'
                : 'bg-white text-gray-800 rounded-tl-none'
            }`}
          >
            <p className="text-sm">{msg.text}</p>
            <span className="text-[10px] opacity-70 mt-1 block text-right">{msg.time}</span>
          </motion.div>
        ))}

        {typing && (
          <div className="bg-white px-4 py-2 rounded-xl w-fit text-xs text-gray-500 animate-pulse">
            Worker is typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white p-4 flex items-center gap-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
          <Paperclip size={20} />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Message worker..."
          className="flex-1 p-2.5 px-4 border border-gray-200 rounded-full outline-none focus:border-blue-400 transition-all text-sm"
        />

        <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
          <Mic size={20} />
        </button>

        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="bg-blue-500 text-white p-2.5 rounded-full hover:bg-blue-600 shadow-md shadow-blue-200 transition-all disabled:opacity-50 disabled:shadow-none"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}