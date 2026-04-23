import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  addDoc, 
  getDocs, 
  serverTimestamp, 
  setDoc, 
  doc,
  limit 
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase/config';
import { WorkerProfile, CATEGORIES, PAK_CITIES } from '../types';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Star, 
  Phone, 
  Filter, 
  X, 
  MessageSquare 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * FilterPill Component
 * Used for the sidebar categories and city selection
 */
const FilterPill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
      active 
        ? 'bg-secondary text-white font-bold shadow-sm' 
        : 'text-high-muted hover:bg-high-bg hover:text-primary'
    }`}
  >
    {label}
  </button>
);

const Home: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [chatCount, setChatCount] = useState(0);

  // Fetch Workers
  useEffect(() => {
    const q = query(
      collection(db, 'workers'),
      where('isApproved', '==', true),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as WorkerProfile);
      setWorkers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch Chat Count
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'chats'),
      where(profile?.role === 'worker' ? 'workerId' : 'clientId', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snap) => setChatCount(snap.size));
    return () => unsub();
  }, [user, profile]);

  const handleStartChat = async (e: React.MouseEvent, worker: WorkerProfile) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert("Please login first");
      return;
    }

    if (user.uid === worker.uid) {
      alert("You cannot chat with yourself.");
      return;
    }

    try {
      const chatsRef = collection(db, 'chats');
      
      const q = query(
        chatsRef,
        where('clientId', '==', user.uid),
        where('workerId', '==', worker.uid)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const chatId = snapshot.docs[0].id;
        navigate(`/chat/${chatId}`);
      } else {
        const newDoc = await addDoc(chatsRef, {
          clientId: user.uid,
          clientEmail: user.email,
          workerId: worker.uid,
          workerName: worker.name,
          createdAt: serverTimestamp(),
          lastMessage: 'Chat started',
        });
        navigate(`/chat/${newDoc.id}`);
      }
    } catch (err: any) {
      console.error("FAILED AT STEP:", err);
      alert("System Error: " + err.message);
    }
  };

  const seedTestData = async () => {
    try {
      const workerEmail = `worker_${Date.now()}@example.com`;
      const workerPass = "password123";
      
      const workerCred = await createUserWithEmailAndPassword(auth, workerEmail, workerPass);
      const workerUid = workerCred.user.uid;

      await setDoc(doc(db, 'workers', workerUid), {
        uid: workerUid,
        name: "John the Electrician",
        category: "Electrician",
        city: "Karachi",
        area: "Gulshan",
        experience: "5",
        phoneNumber: "03001234567",
        isApproved: true,
        createdAt: serverTimestamp(),
        bio: "Professional electrician with 5 years experience."
      });

      await setDoc(doc(db, 'users', workerUid), {
        uid: workerUid,
        email: workerEmail,
        role: 'worker'
      });

      alert("Worker test data created!");
    } catch (err: any) {
      console.error(err);
      alert("Error seeding data: " + err.message);
    }
  };

  const filteredWorkers = workers.filter(worker => {
    const matchesCategory = !selectedCategory || worker.category === selectedCategory;
    const matchesCity = !selectedCity || worker.city === selectedCity;
    const matchesSearch = !searchTerm ||
      worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.bio.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesCity && matchesSearch;
  });

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-68px)] relative">
      <button 
        onClick={seedTestData}
        className="fixed top-24 left-4 z-[100] bg-red-600 text-white p-2 rounded shadow-xl text-xs font-bold"
      >
        🔨 SEED WORKER DATA
      </button>

      {/* Sidebar - Desktop */}
      <aside className="w-full md:w-[260px] bg-white border-r border-high-border p-6 hidden md:flex flex-col gap-8 shrink-0">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-4 w-4 text-high-muted" />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.05em] text-high-muted">Find Profession</h3>
          </div>
          <input
            type="text"
            placeholder="Search skill..."
            className="w-full px-3 py-2 bg-high-bg border border-high-border rounded-lg text-sm focus:ring-1 focus:ring-secondary outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.05em] text-high-muted">Categories</h3>
          <div className="space-y-1.5">
            <FilterPill label="All Categories" active={selectedCategory === ''} onClick={() => setSelectedCategory('')} />
            {CATEGORIES.map(cat => (
              <FilterPill key={cat} label={cat} active={selectedCategory === cat} onClick={() => setSelectedCategory(cat)} />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.05em] text-high-muted">Service City</h3>
          <div className="space-y-1.5">
            <FilterPill label="All Cities" active={selectedCity === ''} onClick={() => setSelectedCity('')} />
            {PAK_CITIES.map(city => (
              <FilterPill key={city} label={city} active={selectedCity === city} onClick={() => setSelectedCity(city)} />
            ))}
          </div>
        </div>
      </aside>

      {/* Main Grid */}
      <main className="flex-grow p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-between items-end border-b border-high-border pb-4">
            <div>
              <h2 className="text-2xl font-black text-primary tracking-tight">
                {selectedCategory || 'All Professionals'}
                <span className="text-secondary ml-2">in {selectedCity || 'Pakistan'}</span>
              </h2>
              <p className="text-high-muted text-sm mt-1">Showing {filteredWorkers.length} of {workers.length} active workers</p>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Apply' : 'Filters'}
            </button>
          </div>

          {/* Mobile Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="md:hidden bg-white p-4 rounded-xl border border-high-border shadow-lg grid grid-cols-2 gap-4"
              >
                <select className="bg-high-bg border border-high-border rounded-lg p-2 text-sm" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option value="">Categories</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <select className="bg-high-bg border border-high-border rounded-lg p-2 text-sm" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                  <option value="">Cities</option>
                  {PAK_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Search..."
                  className="col-span-2 bg-high-bg border border-high-border rounded-lg p-2 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWorkers.map((worker) => (
                <motion.div
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={worker.uid}
                  className="bg-white rounded-xl border border-high-border p-4 hover:shadow-lg transition-all relative flex flex-col"
                >
                  <div className="flex gap-4 mb-4 items-start">
                    <img
                      src={worker.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${worker.uid}`}
                      alt={worker.name}
                      className="w-14 h-14 rounded-full object-cover shrink-0 bg-slate-100 border border-high-border p-0.5"
                    />
                    <div className="flex-grow overflow-hidden">
                      <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-black uppercase mb-1 tracking-wider">
                        {worker.category}
                      </span>
                      <h4 className="text-md font-extrabold text-primary truncate leading-tight">{worker.name}</h4>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-high-muted mb-4 flex-grow">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-secondary" />
                      <span className="truncate">{worker.area}, {worker.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-3 w-3 text-orange-400 fill-orange-400" />
                      <span>4.9 (Verified)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-3 w-3 text-secondary" />
                      <span>{worker.experience} Years Experience</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <a
                      href={`tel:${worker.phoneNumber}`}
                      className="w-full bg-secondary text-white rounded-lg py-2.5 text-sm font-bold text-center hover:bg-secondary/90 transition-all flex items-center justify-center gap-2"
                    >
                      <Phone className="h-4 w-4" /> Call
                    </a>
                    <button
                      type="button"
                      onClick={(e) => handleStartChat(e, worker)}
                      className="w-full bg-primary text-white rounded-lg py-2.5 text-sm font-bold text-center hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" /> Chat
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Chat Button */}
      {user && (
        <div className="fixed bottom-8 right-8 z-[999] pointer-events-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              try {
                const chatsRef = collection(db, 'chats');
                const q = query(
                  chatsRef,
                  where(profile?.role === 'worker' ? 'workerId' : 'clientId', '==', user.uid),
                  orderBy('createdAt', 'desc'),
                  limit(1)
                );

                const snap = await getDocs(q);

                if (!snap.empty) {
                  const latestChatId = snap.docs[0].id;
                  navigate(`/chat/${latestChatId}`);
                } else {
                  alert("You don't have any active messages yet. Choose a professional to start a conversation!");
                }
              } catch (error) {
                console.error("Error fetching latest chat:", error);
              }
            }}
            className="relative p-4 bg-primary text-white rounded-full shadow-2xl border border-white/20 flex items-center justify-center group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <MessageSquare className="h-6 w-6 relative z-10" />
            {chatCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white z-20">
                {chatCount}
              </span>
            )}
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default Home;