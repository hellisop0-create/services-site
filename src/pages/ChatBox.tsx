import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { Send, MessageSquare, ShieldCheck } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName?: string;
  createdAt: any;
}

interface ChatBoxProps {
  chatId: string;
  currentUser: { uid: string; email: string; role: string };
}

const ChatBox: React.FC<ChatBoxProps> = ({ chatId, currentUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Listen for messages
  useEffect(() => {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
    });

    return () => unsub();
  }, [chatId]);

  // 2. Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage;
    setNewMessage('');

    try {
      // Add message
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text,
        senderId: currentUser.uid,
        senderName: currentUser.email.split('@')[0], // Fallback name
        createdAt: serverTimestamp(),
      });

      // Update main chat list info
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Chat Error:", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#fdfdfd]">
      {/* 🛡️ Secure Header Bar */}
      <div className="px-6 py-2 border-b border-slate-100 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400">
          <ShieldCheck size={14} className="text-secondary" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Verified Session</span>
        </div>
      </div>

      {/* 💬 Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.uid;
          const displayName = msg.senderName || "User";

          return (
            <div 
              key={msg.id} 
              className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                {/* Name Label */}
                {!isMe && (
                  <span className="text-[10px] font-black text-slate-400 ml-1 mb-1 uppercase">
                    {displayName}
                  </span>
                )}
                
                {/* Bubble */}
                <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                  isMe 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* ⌨️ Input Bar */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="flex items-center gap-3 max-w-5xl mx-auto">
          <input 
            type="text"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white transition-all"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button 
            type="submit"
            className="bg-primary text-white p-3 rounded-xl hover:opacity-90 shadow-lg shadow-primary/20"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;