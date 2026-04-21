import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Assuming this provides your user
import ChatBox from '../components/ChatBox'; // Adjust path as needed

const ChatWindow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();

  if (!user || !profile) {
    return <div className="p-10 text-center">Loading your session...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => window.history.back()}
          className="mb-4 text-sm text-slate-500 hover:text-primary flex items-center gap-2"
        >
          ← Back to Professionals
        </button>
        
        {/* Pass the ID and User info to the component you just wrote */}
        {id && (
          <ChatBox 
            chatId={id} 
            currentUser={{
              uid: user.uid,
              email: user.email || '',
              role: profile.role || 'client'
            }} 
          />
        )}
      </div>
    </div>
  );
};

export default ChatWindow;