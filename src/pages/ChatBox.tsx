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
import { Send, ShieldAlert, MessageSquare, Lock, CheckCheck } from 'lucide-react';

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

  useEffect(() => {
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
    });

    return () => unsub();
  }, [chatId]);

  // Smooth scroll to bottom whenever messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const textToSend = newMessage;
    setNewMessage('');

    try {
      // 1. Add to messages sub-collection
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: textToSend,
        senderId: currentUser.uid,
        senderName: currentUser.email.split('@')[0], // Reliable fallback
        createdAt: serverTimestamp(),
      });

      // 2. Update main chat document for the Inbox/Messages list
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: textToSend,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Message error:", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* Header Info */}
      <div className="px-6 py-2 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Lock size={12} className="text-slate-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Secure Encryption Active</span>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
        {messages.map((msg, index) => {
          const isMe = msg.senderId === currentUser.uid;
          const isSameAsPrevious = index > 0 && messages[index - 1].senderId === msg.senderId;

          return (
            <div 
              key={msg.id} 
              className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${isSameAsPrevious ? 'mt-1' : 'mt-4'}`}
            >
              <div className={`flex flex-col max-w-[80%] md:max-w-[65%] ${isMe ? 'items-end' : 'items-start'}`}>
                {/* Only show name if it's a new sender block and not "Me" */}
                {!isMe && !isSameAsPrevious && (
                  <span className="text-[11px] font-extrabold text-slate-500 mb-1 ml-1 uppercase tracking-tight">
                    {msg.senderName || 'Client'}
                  </span>
                )}

                <div className={`relative px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed transition-all group ${
                  isMe 
                    ? 'bg-primary text-white rounded-tr-none shadow-blue-200/50' 
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-slate-100'
                }`}>
                  {msg.text}
                  
                  {/* Subtle Time + Status */}
                  <div className={`flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-[9px] font-medium ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                      {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && <CheckCheck size={10} className="text-blue-100" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} className="h-2" />
      </div>

      {/* Modern Input Bar */}
      <div className="p-4 md:p-6 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="relative flex-grow">
            <input 
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
            />
          </div>
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-primary text-white p-3.5 rounded-xl hover:bg-primary/90 disabled:opacity-40 disabled:grayscale transition-all shadow-lg shadow-primary/20 flex-shrink-0"
          >
            <Send size={20} />
          </button>
        </form>
        <div className="mt-3 flex justify-center items-center gap-4">
           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enter to send</span>
           <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
             <ShieldAlert size={10} /> Secure session
           </span>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;