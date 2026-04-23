import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import ChatBox from '../components/ChatBox';
import { ChevronLeft, Info, ShieldCheck, MessageCircle } from 'lucide-react';

const ChatWindow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [chatPartnerName, setChatPartnerName] = useState<string>('Chat');

  // Optional: Fetch the chat document to show the partner's name in the header
  useEffect(() => {
    const fetchChatDetails = async () => {
      if (!id) return;
      const chatSnap = await getDoc(doc(db, 'chats', id));
      if (chatSnap.exists()) {
        const data = chatSnap.data();
        // If current user is client, show workerName, else show clientEmail/Name
        const partnerName = profile?.role === 'client' 
          ? data.workerName 
          : (data.clientName || data.clientEmail.split('@')[0]);
        setChatPartnerName(partnerName);
      }
    };
    fetchChatDetails();
  }, [id, profile]);

  if (!user || !profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-slate-500 font-medium">Securing connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-68px)] bg-slate-50 flex flex-col">
      {/* Top Professional Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
            title="Go back"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">
                {chatPartnerName}
              </h1>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider">Active Conversation</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-slate-400">
          <div className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 bg-slate-100 rounded text-slate-500">
            <ShieldCheck className="h-3 w-3" />
            END-TO-END ENCRYPTED
          </div>
          <button className="hover:text-primary transition-colors">
            <Info className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <main className="flex-grow overflow-hidden flex flex-col relative">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        
        <div className="flex-grow max-w-5xl w-full mx-auto p-4 md:p-6 flex flex-col z-10">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 flex-grow flex flex-col overflow-hidden">
            {id ? (
              <ChatBox 
                chatId={id} 
                currentUser={{
                  uid: user.uid,
                  email: user.email || '',
                  role: profile.role || 'client'
                }} 
              />
            ) : (
              <div className="flex-grow flex items-center justify-center text-slate-400">
                Select a conversation to begin.
              </div>
            )}
          </div>
          
          <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-widest font-medium">
            Professional Work Platform • Secure Messaging
          </p>
        </div>
      </main>
    </div>
  );
};

export default ChatWindow;