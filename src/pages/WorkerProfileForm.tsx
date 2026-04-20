import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { CATEGORIES, PAK_CITIES, WorkerProfile } from '../types';
import { Camera, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

const WorkerProfileForm: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<Partial<WorkerProfile>>({
    name: '',
    phoneNumber: '',
    city: '',
    area: '',
    category: '',
    experience: 1,
    bio: '',
    profileImage: '',
  });

  useEffect(() => {
    if (user) {
      const fetchWorker = async () => {
        const docRef = doc(db, 'workers', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFormData(docSnap.data() as WorkerProfile);
        }
        setFetched(true);
      };
      fetchWorker();
    }
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    try {
      const storageRef = ref(storage, `workers/${user.uid}/profile_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, profileImage: url }));
    } catch (err) {
      setError('Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const docRef = doc(db, 'workers', user.uid);
      const workerData = {
        ...formData,
        uid: user.uid,
        updatedAt: serverTimestamp(),
      };

      // If it's a new profile, set defaults
      if (!formData.status) {
        Object.assign(workerData, {
          isApproved: false,
          status: 'pending',
          createdAt: serverTimestamp(),
        });
      }

      await setDoc(docRef, workerData, { merge: true });
      setSuccess(true);
      setTimeout(() => navigate('/profile'), 2000);
    } catch (err) {
      setError('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  if (!fetched) return <div className="p-10 text-center">Loading profile...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-lg p-8 border border-high-border border-t-8 border-t-secondary"
      >
        <div className="mb-8">
          <h1 className="text-2xl font-black text-primary tracking-tight uppercase">Professional Setup</h1>
          <p className="text-high-muted text-xs font-bold uppercase tracking-wider mt-1">Configure your worker profile</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-accent/10 border border-accent/20 text-accent font-black text-xs uppercase tracking-widest rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5" />
            Data Saved Successfully
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Image */}
          <div className="flex flex-col items-center gap-4 p-8 bg-high-bg rounded-xl border border-high-border">
            <div className="relative group">
              <img
                src={formData.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl ring-1 ring-high-border"
              />
              <label className="absolute bottom-0 right-0 bg-secondary text-white p-2.5 rounded-full cursor-pointer shadow-xl hover:scale-110 transition-all">
                <Camera className="h-4 w-4" />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
            <p className="text-[10px] text-high-muted font-black uppercase tracking-[0.15em]">Upload Identity Photo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-high-muted uppercase tracking-widest">Full Legal Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 bg-high-bg border border-high-border rounded-lg text-sm font-bold focus:ring-1 focus:ring-secondary outline-none transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-high-muted uppercase tracking-widest">Contact Phone</label>
              <input
                type="tel"
                required
                placeholder="03XXXXXXXXX"
                className="w-full px-4 py-2.5 bg-high-bg border border-high-border rounded-lg text-sm font-bold focus:ring-1 focus:ring-secondary outline-none transition-all"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-high-muted uppercase tracking-widest">Skill Category</label>
              <select
                required
                className="w-full px-4 py-2.5 bg-high-bg border border-high-border rounded-lg text-sm font-bold focus:ring-1 focus:ring-secondary outline-none transition-all"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Select Category</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-high-muted uppercase tracking-widest">Years of XP</label>
              <input
                type="number"
                min="0"
                required
                className="w-full px-4 py-2.5 bg-high-bg border border-high-border rounded-lg text-sm font-bold focus:ring-1 focus:ring-secondary outline-none transition-all"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-high-muted uppercase tracking-widest">Service City</label>
              <select
                required
                className="w-full px-4 py-2.5 bg-high-bg border border-high-border rounded-lg text-sm font-bold focus:ring-1 focus:ring-secondary outline-none transition-all"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              >
                <option value="">Select City</option>
                {PAK_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-high-muted uppercase tracking-widest">Specific Area</label>
              <input
                type="text"
                required
                placeholder="e.g. DHA, Gulshan..."
                className="w-full px-4 py-2.5 bg-high-bg border border-high-border rounded-lg text-sm font-bold focus:ring-1 focus:ring-secondary outline-none transition-all"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-high-muted uppercase tracking-widest">Professional Bio</label>
            <textarea
              rows={4}
              required
              placeholder="Summary of your professional expertise..."
              className="w-full px-4 py-2.5 bg-high-bg border border-high-border rounded-lg text-sm font-bold focus:ring-1 focus:ring-secondary outline-none transition-all"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary text-white font-black uppercase tracking-[0.2em] py-4 rounded-lg hover:bg-secondary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:translate-y-px"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Processing...' : 'Deploy Profile'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default WorkerProfileForm;
