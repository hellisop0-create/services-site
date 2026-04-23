import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Send, Paperclip, Mic, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase/config';
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';

export default function WorkerChatPage() {
  const { id: chatId } = useParams();
  const location = useLocation();
  const { user } = useAuth();

  const [worker, setWorker] = useState(location.state?.worker || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!chatId || !user) return;

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

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: doc.data().createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''
      }));
      setMessages(msgs);
    });

    fetchChatMeta();
    return () => unsub();
  }, [chatId, user]);

  useEffect(() => {
    // Immediate scroll without smooth behavior on first load to prevent "jumping"
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages.length === 1]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user || !chatId) return;
    const text = input;
    setInput('');

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: text,
        senderId: user.uid,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Send Error:", err);
    }
  };

  if (!worker) return <div className="h-full flex items-center justify-center">Loading...</div>;

  return (
    /* h-[calc(100vh-68px)] ensures it stays within the viewport minus your navbar */
    <div className="h-[calc(100vh-68px)] flex flex-col bg-gray-50 overflow-hidden relative">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
            {worker.name.charAt(0)}
          </div>
          <div>
            <h2 className="font-bold text-sm leading-tight">{worker.name}</h2>
            <p className="text-[11px] text-gray-500">
              {worker.online ? '• Online' : 'Offline'}
            </p>
          </div>
        </div>
        <MoreVertical className="text-gray-400 w-5 h-5 cursor-pointer" />
      </div>

      {/* Messages Area - flex-1 with overflow-y-auto is key for stability */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                msg.senderId === user?.uid
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
              }`}>
                <p>{msg.text}</p>
                <span className={`text-[10px] block mt-1 opacity-60 ${msg.senderId === user?.uid ? 'text-right' : 'text-left'}`}>
                  {msg.time}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Input - Positioned at bottom of the flex container */}
      <div className="bg-white border-t border-gray-100 p-3 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-full">
            <Paperclip size={20} />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Write a message..."
            className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-blue-400 transition-all text-sm"
          />

          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="bg-blue-600 text-white p-2.5 rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-40 shadow-md shadow-blue-100"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
