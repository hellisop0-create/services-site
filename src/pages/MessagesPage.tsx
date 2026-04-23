import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ChevronRight, User } from 'lucide-react';

const MessagesPage = () => {
  const { user, profile } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Inside MessagesPage.tsx
  useEffect(() => {
    if (!user || !profile) return;

    const chatsRef = collection(db, 'chats');

    // Use 'createdAt' if you haven't implemented 'updatedAt' in your chat logic yet
    const q = query(
      chatsRef,
      where(profile.role === 'worker' ? 'workerId' : 'clientId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q,
      (snap) => {
        const chatList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setChats(chatList);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore Error:", error);
        setLoading(false); // Stop loading even if there's an error
      }
    );

    return () => unsub();
  }, [user, profile]);

  if (loading) return <div className="p-10 text-center">Loading inbox...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-black text-primary mb-6">Messages</h1>

      {chats.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <MessageSquare size={32} />
          </div>
          <h3 className="text-gray-800 font-bold">No messages yet</h3>
          <p className="text-gray-400 text-sm mt-1">Start a conversation with a professional to see it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chats.map((chat: any) => (
            <div
              key={chat.id}
              onClick={() => navigate(`/chat/${chat.id}`)}
              className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                <User size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800">
                  {profile?.role === 'worker' ? chat.clientEmail : chat.workerName}
                </h4>
                <p className="text-xs text-gray-400 truncate max-w-[200px]">
                  {chat.lastMessage || "No messages yet"}
                </p>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors" size={18} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessagesPage;