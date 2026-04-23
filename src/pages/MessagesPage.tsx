import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, User, ChevronRight } from 'lucide-react';

const MessagesPage = () => {
  const { user, profile } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const chatsRef = collection(db, 'chats');

    const unsub = onSnapshot(chatsRef, (snap) => {
      const allChats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter chats where I am either the client or the worker
      const myChats = allChats.filter((chat: any) => 
        chat.clientId === user.uid || chat.workerId === user.uid
      );

      setChats(myChats);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  if (loading) return <div className="p-10 text-center animate-pulse text-gray-400">Loading your inbox...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen">
      <h1 className="text-2xl font-black text-primary mb-6">Messages</h1>

      {chats.length === 0 ? (
        <div className="text-center p-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
           <MessageSquare className="mx-auto text-gray-300 mb-4" size={48} />
           <p className="text-gray-500 font-bold">No conversations yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chats.map((chat: any) => {
            // LOGIC: If I am the client, show the Worker's Name. 
            // If I am the worker, show the Client's Email.
            const displayName = profile?.role === 'worker' 
              ? (chat.clientEmail || "Client") 
              : (chat.workerName || chat.workerEmail || "Service Provider");

            return (
              <div 
                key={chat.id}
                onClick={() => navigate(`/chat/${chat.id}`)}
                className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-bold text-gray-900 truncate">
                    {displayName}
                  </h4>
                  <p className="text-sm text-gray-500 truncate">
                    {chat.lastMessage || "No messages yet"}
                  </p>
                </div>

                <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors" size={20} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MessagesPage;