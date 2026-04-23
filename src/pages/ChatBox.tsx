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
import { Send, ShieldAlert, MessageSquare, Lock } from 'lucide-react';

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

  // Real-time Message Listener
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

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage;
    setNewMessage(''); // Clear input immediately for better UX

    try {
      // 1. Add message to sub-collection
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: messageText,
        senderId: currentUser.uid,
        senderName: isAdmin ? `Admin` : (currentUser.email.split('@')[0]),
        createdAt: serverTimestamp(),
      });

      // 2. Update main chat doc (Crucial for the Messages/Inbox page!)
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: messageText,
        createdAt: serverTimestamp(), // Update this to move chat to top of inbox
      });

    } catch (error) {
      console.error("Message send failed:", error);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden">
      
      {/* Subtle "Safe Zone" Banner */}
      <div className="bg-slate-50/50 border-b border-slate-100 py-2 px-6 flex justify-center items-center gap-2">
         <Lock size={10} className="text-slate-400" />
         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
           Secure workspace session
         </span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-[#fcfdfe]">
        {messages.map((msg, index) => {
          const isMe = msg.senderId === currentUser.uid;
          const showSenderName = index === 0 || messages[index - 1].senderId !== msg.senderId;

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[70%] space-y-1`}>
                {showSenderName && !isMe && (
                  <p className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    {msg.senderName}
                  </p>
                )}
                
                <div className={`group relative px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm transition-all ${
                  isMe 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                }`}>
                  {msg.text}
                  
                  {/* Timestamp visible on hover for pro feel */}
                  <div className={`absolute -bottom-5 whitespace-nowrap text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'right-0' : 'left-0'}`}>
                    {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Professional Input Field */}
      <div className="p-4 md:p-6 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center">
          <input 
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-5 pr-14 py-4 text-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-slate-700 placeholder:text-slate-400"
            placeholder="Type your message here..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <div className="absolute right-2 flex items-center gap-2">
            {isAdmin && <ShieldAlert size={16} className="text-red-400 mr-1" />}
            <button 
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-primary text-white p-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-all shadow-lg shadow-primary/20"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
        <p className="text-center text-[9px] text-slate-400 mt-3 font-medium uppercase tracking-tight">
          Press Enter to send
        </p>
      </div>
    </div>
  );
};

export default ChatBox;