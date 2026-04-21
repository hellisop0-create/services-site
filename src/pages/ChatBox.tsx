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
  <div className="flex flex-col h-[70vh] w-full max-w-3xl mx-auto bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
    {/* Professional Header */}
    <div className="bg-white border-b border-slate-100 p-5 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-primary">
          <MessageSquare size={20} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Secure Message Session</h3>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">End-to-end Encrypted</p>
        </div>
      </div>
      
      {isAdmin && (
        <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-red-100">
          <ShieldAlert size={12} /> Admin Support
        </div>
      )}
    </div>

    {/* Messages Area */}
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#f8fafc]">
      {messages.map((msg) => {
        const isMe = msg.senderId === currentUser.uid;
        return (
          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] space-y-1`}>
              <p className={`text-[10px] font-bold text-slate-400 uppercase px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                {isMe ? 'You' : msg.senderName}
              </p>
              <div className={`p-4 rounded-2xl text-[14px] leading-relaxed shadow-sm ${
                isMe 
                  ? 'bg-primary text-white rounded-tr-none shadow-blue-100' 
                  : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={scrollRef} />
    </div>

    {/* Professional Input Field */}
    <div className="p-4 bg-white border-t border-slate-50">
      <form onSubmit={handleSend} className="relative flex items-center">
        <input 
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-5 pr-14 py-4 text-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-slate-700"
          placeholder="Write your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button className="absolute right-2 bg-primary text-white p-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
          <Send size={18} />
        </button>
      </form>
    </div>
  </div>
);
};

export default ChatBox;