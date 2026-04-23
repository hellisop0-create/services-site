import React, { useEffect, useState, useRef } from 'react';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Send, Check, CheckCheck } from 'lucide-react';

const ChatBox = ({ chatId, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // 🔥 REAL-TIME MESSAGES
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setMessages(msgs);

      // ✅ Mark messages as seen (Production Logic)
      snapshot.docs.forEach(async (docSnap) => {
        const data = docSnap.data();
        if (data.senderId !== currentUser.uid && !data.seen) {
          try {
            await updateDoc(doc(db, 'chats', chatId, 'messages', docSnap.id), {
              seen: true
            });
          } catch (err) {
            console.error("Error updating seen status:", err);
          }
        }
      });
    });

    return () => unsubscribe();
  }, [chatId, currentUser.uid]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 🔥 SEND MESSAGE (Production Ready)
  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const textToSend = input;
    setInput('');

    try {
      // 1. Add message to sub-collection
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: textToSend,
        senderId: currentUser.uid,
        createdAt: serverTimestamp(),
        seen: false
      });

      // 2. Update parent chat document for the Inbox/Messages list preview
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: textToSend,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.uid;

          return (
            <div
              key={msg.id}
              className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 px-4 rounded-2xl shadow-sm relative ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-100'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-sm'
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>

                {/* Production Status Icons */}
                {isMe && (
                  <div className="flex justify-end items-center mt-1 opacity-80">
                    {msg.seen ? (
                      <CheckCheck size={13} className="text-blue-100" />
                    ) : (
                      <Check size={13} className="text-blue-100" />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Input Bar - Standardized & Fixed */}
      <div className="p-4 border-t bg-white shrink-0">
        <form 
          onSubmit={sendMessage}
          className="max-w-5xl mx-auto flex gap-3 items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-gray-100 border-none p-3 px-5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm transition-all"
          />

          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-all flex items-center justify-center shrink-0 shadow-lg shadow-blue-100"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;