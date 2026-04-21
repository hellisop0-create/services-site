import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Send, ShieldAlert } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
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

  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    // Reference the messages sub-collection
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Message));
      setMessages(msgs);
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    return () => unsub();
  }, [chatId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      text: newMessage,
      senderId: currentUser.uid,
      senderName: isAdmin ? `Admin (${currentUser.email})` : currentUser.email,
      createdAt: serverTimestamp(),
    });

    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-primary p-4 text-white flex justify-between items-center">
        <h3 className="font-bold uppercase text-xs tracking-widest">Live Chat Session</h3>
        {isAdmin && (
          <div className="flex items-center gap-1 bg-red-500/20 px-2 py-1 rounded text-[10px] font-black uppercase">
            <ShieldAlert size={12} /> Admin Mode
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`group relative max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
              msg.senderId === currentUser.uid 
                ? 'bg-primary text-white rounded-tr-none' 
                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
            }`}>
              <p className="text-[9px] font-black opacity-50 uppercase mb-1">{msg.senderName}</p>
              <p className="leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Footer / Input */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
        <input 
          className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
          placeholder={isAdmin ? "Type an official admin message..." : "Type your message..."}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button className="bg-secondary text-white p-3 rounded-xl hover:shadow-lg transition-all active:scale-95">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatBox;