import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { auth, db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { Menu, X, Hammer, User as UserIcon, Shield, LogOut, Info } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const AdminNavOption: React.FC<{ isAdmin: boolean; mobile?: boolean; onClose?: () => void }> = ({ isAdmin, mobile, onClose }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleAccess = (e: React.FormEvent) => {
    e.preventDefault();
    const secret = (import.meta as any).env.VITE_ADMIN_PASSWORD || 'admin123';
    // If already admin or password matches
    if (isAdmin || password === secret) {
      if (onClose) onClose();
      navigate('/admin');
      setShowPrompt(false);
      setPassword('');
    } else {
      alert('Invalid security code');
    }
  };

  if (mobile) {
    return (
      <div className="px-3 py-2">
        {!showPrompt ? (
          <button 
            onClick={() => setShowPrompt(true)}
            className="flex items-center text-accent font-bold uppercase text-xs tracking-widest"
          >
            <Shield className="h-4 w-4 mr-1" />
            Admin Panel
          </button>
        ) : (
          <form onSubmit={handleAccess} className="flex gap-2">
            <input 
              autoFocus
              type="password"
              placeholder="Code..."
              className="flex-grow px-2 py-1 bg-white/10 border border-white/20 rounded text-xs outline-none focus:border-accent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="bg-accent text-primary px-3 py-1 rounded text-[10px] font-black uppercase">
              Go
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setShowPrompt(!showPrompt)}
        className="flex items-center text-slate-300 hover:text-white text-sm font-semibold transition-colors uppercase tracking-wider"
      >
        <Shield className="h-4 w-4 mr-1 text-accent" />
        Admin
      </button>

      {showPrompt && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 z-[100] text-slate-900 animate-in fade-in slide-in-from-top-2">
          <form onSubmit={handleAccess} className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Security Gate</p>
            <input 
              autoFocus
              type="password"
              placeholder="Enter Code..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-secondary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="w-full bg-primary text-white py-2 rounded-lg text-xs font-bold hover:bg-secondary transition-colors">
              Verify & Enter
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, profile, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setBanner(docSnap.data().banner || null);
      }
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-high-bg flex flex-col font-sans">
      <nav className="bg-primary text-white border-b-4 border-secondary sticky top-0 z-50 shadow-md">
        {banner && (
          <div className="bg-accent text-primary px-4 py-1.5 text-center text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
            <Info className="h-3 w-3" />
            {banner}
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2 group">
                <div className="bg-secondary p-1.5 rounded-md group-hover:scale-105 transition-transform">
                  <Hammer className="text-white h-5 w-5" />
                </div>
                <span className="text-xl font-black tracking-tighter uppercase">
                  PakServ<span className="text-accent underline decoration-2 underline-offset-4">.pk</span>
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-slate-300 hover:text-white text-sm font-semibold transition-colors">Browse Workers</Link>
              
              {/* Admin Dashboard Option with logic */}
              <AdminNavOption isAdmin={isAdmin} />

              {user ? (
                <>
                  <Link to="/profile" className="flex items-center text-slate-300 hover:text-white text-sm font-semibold transition-colors">
                    <UserIcon className="h-4 w-4 mr-1" />
                    Profile
                  </Link>
                  <button onClick={handleLogout} className="flex items-center text-slate-300 hover:text-red-400 text-sm font-semibold transition-colors">
                    <LogOut className="h-4 w-4 mr-1" />
                    Logout
                  </button>
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold ring-2 ring-white/10">
                    {profile?.email?.charAt(0).toUpperCase()}
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link to="/login" className="text-slate-300 hover:text-white text-sm font-semibold transition-colors">Login</Link>
                  <Link to="/signup" className="bg-secondary text-white rounded-md px-4 py-2 hover:bg-secondary/90 transition-all text-sm font-bold shadow-sm active:translate-y-px">Start Working</Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white hover:bg-slate-800 p-2 rounded-lg transition-colors"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-primary border-t border-white/10">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-slate-300 font-bold">Browse Services</Link>
              
              <AdminNavOption isAdmin={isAdmin} mobile onClose={() => setIsMenuOpen(false)} />

              {user ? (
                <>
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-slate-300 font-bold">My Account</Link>
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-red-400 font-bold">Sign Out</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-slate-300 font-bold">Login</Link>
                  <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-accent font-black">Get Started</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-primary text-white py-12 border-t-4 border-secondary/20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
             <span className="text-xl font-black tracking-tighter uppercase">
                  PakServ<span className="text-accent underline decoration-2 underline-offset-4">.pk</span>
             </span>
          </div>
          <p className="text-slate-400 text-xs font-medium tracking-widest uppercase">© {new Date().getFullYear()} PakServ Marketplace. Built for Pakistan.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
