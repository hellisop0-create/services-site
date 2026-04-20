import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { WorkerProfile } from '../types';
import { User, Hammer, MapPin, Briefcase, Phone, Clock, ShieldCheck, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

const UserProfilePage: React.FC = () => {
  const { user, profile } = useAuth();
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile?.role === 'worker') {
      const fetchWorker = async () => {
        const docSnap = await getDoc(doc(db, 'workers', user.uid));
        if (docSnap.exists()) {
          setWorkerProfile(docSnap.data() as WorkerProfile);
        }
        setLoading(false);
      };
      fetchWorker();
    } else {
      setLoading(false);
    }
  }, [user, profile]);

  if (!user || !profile) return <div className="p-10 text-center">Please login to view your profile.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* User Card */}
        <div className="bg-white rounded-xl shadow-sm p-8 border border-high-border flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="w-24 h-24 bg-high-bg border border-high-border rounded-full flex items-center justify-center shrink-0">
            <User className="h-10 w-10 text-secondary" />
          </div>
          <div className="flex-grow space-y-4">
            <div>
              <h2 className="text-2xl font-black text-primary">{profile.email}</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-2 py-0.5 bg-secondary text-white rounded text-[10px] font-black uppercase tracking-widest">
                  {profile.role}
                </span>
                <span className="text-high-muted text-xs font-bold flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  SINCE {profile.createdAt?.toDate().toLocaleDateString().toUpperCase()}
                </span>
              </div>
            </div>
            
            {profile.role === 'worker' && !workerProfile && (
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg">
                <p className="text-orange-900 text-xs font-bold uppercase tracking-wider">Professional Profile Required</p>
                <Link to="/profile/edit" className="inline-block mt-1 text-orange-700 font-bold text-sm underline">
                  Complete setup to appear in search
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Worker Professional Profile Section */}
        {profile.role === 'worker' && workerProfile && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-high-border">
            <div className="bg-primary px-6 py-3 flex items-center justify-between border-b-4 border-secondary">
              <h3 className="text-white text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <Hammer className="h-4 w-4 text-accent" />
                Verified Service Profile
              </h3>
              <Link to="/profile/edit" className="text-accent text-[10px] font-black uppercase tracking-wider hover:underline">
                Update Data
              </Link>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Approval Status */}
              <div className={`flex items-center gap-4 p-4 rounded-lg border-l-4 ${
                workerProfile.status === 'approved' ? 'bg-green-50 text-green-900 border-accent' :
                workerProfile.status === 'rejected' ? 'bg-red-50 text-red-900 border-red-500' : 'bg-orange-50 text-orange-900 border-orange-400'
              }`}>
                {workerProfile.status === 'approved' ? <ShieldCheck className="h-6 w-6 text-accent" /> : <ShieldAlert className="h-6 w-6 text-orange-500" />}
                <div>
                  <p className="font-black text-xs uppercase tracking-wider">Profile Status: {workerProfile.status}</p>
                  <p className="text-xs font-medium opacity-80 mt-1">
                    {workerProfile.status === 'approved' ? 'Your profile is live across Pakistan.' : 
                     workerProfile.status === 'rejected' ? 'Rejected. Please correct your data and resubmit.' :
                     'Verification in progress. Usually takes 24-48 hours.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="aspect-square rounded-xl overflow-hidden bg-high-bg border border-high-border p-1">
                  <img src={workerProfile.profileImage} alt={workerProfile.name} className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                </div>
                
                <div className="md:col-span-2 space-y-6">
                  <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    <ProfileItem label="Display Name" value={workerProfile.name} />
                    <ProfileItem label="Expertise" value={workerProfile.category} />
                    <ProfileItem label="Service Area" value={`${workerProfile.area}, ${workerProfile.city}`} />
                    <ProfileItem label="Contact Link" value={workerProfile.phoneNumber} />
                    <ProfileItem label="Experience" value={`${workerProfile.experience} Years`} />
                  </div>
                  
                  <div className="pt-6 border-t border-high-border">
                    <label className="text-[10px] font-black text-high-muted uppercase tracking-[0.2em] block mb-2">Professional Summary</label>
                    <p className="text-primary text-sm leading-relaxed font-medium">"{workerProfile.bio}"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const ProfileItem = ({ label, value }: any) => (
  <div className="space-y-1">
    <div className="text-[10px] font-black text-high-muted uppercase tracking-[0.1em]">
      {label}
    </div>
    <div className="text-primary font-bold border-l-2 border-secondary pl-2">{value}</div>
  </div>
);

export default UserProfilePage;
