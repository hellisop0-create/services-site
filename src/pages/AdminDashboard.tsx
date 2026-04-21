import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { UserProfile, WorkerProfile } from '../types';
import { Users, Hammer, Shield, Trash2, CheckCircle, XCircle, Search, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'workers' | 'settings'>('stats');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingWorker, setEditingWorker] = useState<WorkerProfile | null>(null);
  const [globalBanner, setGlobalBanner] = useState('');

  useEffect(() => {
  setLoading(true);

  // 1. Listen to Users
  const unsubUsers = onSnapshot(collection(db, 'users'), 
    (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile)));
    },
    (err) => console.error("User list access denied. Are you an admin?", err)
  );

  // 2. Listen to Workers
  const unsubWorkers = onSnapshot(collection(db, 'workers'), 
    (snapshot) => {
      setWorkers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkerProfile)));
    },
    (err) => console.error("Worker list access denied.", err)
  );

  // 3. Listen to Settings
  const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
    if (docSnap.exists()) {
      setGlobalBanner(docSnap.data().banner || '');
    }
    setLoading(false); // Global stop loading
  }, (error) => {
    console.error("Settings listener failed:", error);
    setLoading(false); 
  });

  return () => {
    unsubUsers();
    unsubWorkers();
    unsubSettings();
  };
}, []);

  const handleUpdateRole = async (uid: string, newRole: any) => {
    await updateDoc(doc(db, 'users', uid), { role: newRole });
    if (newRole === 'admin') {
      await setDoc(doc(db, 'admins', uid), { uid });
    }
  };

  const handleSaveWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorker) return;
    await updateDoc(doc(db, 'workers', editingWorker.uid), { ...editingWorker });
    setEditingWorker(null);
  };

  const handleUpdateSettings = async () => {
    await setDoc(doc(db, 'settings', 'general'), { banner: globalBanner }, { merge: true });
    alert('Settings updated successfully!');
  };

  const handleApproveWorker = async (uid: string) => {
    await updateDoc(doc(db, 'workers', uid), {
      isApproved: true,
      status: 'approved'
    });
  };

  const handleRejectWorker = async (uid: string) => {
    await updateDoc(doc(db, 'workers', uid), {
      isApproved: false,
      status: 'rejected'
    });
  };

  const handleDeleteUser = async (uid: string) => {
    if (window.confirm('Are you sure you want to delete this user? This cannot be undone.')) {
      await deleteDoc(doc(db, 'users', uid));
      // Also delete worker profile if exists
      const workerDoc = doc(db, 'workers', uid);
      await deleteDoc(workerDoc);
    }
  };

  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredWorkers = workers.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    w.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.phoneNumber.includes(searchTerm)
  );

  const stats = {
    totalUsers: users.length,
    totalWorkers: workers.length,
    totalClients: users.filter(u => u.role === 'client').length,
    pendingWorkers: workers.filter(w => w.status === 'pending').length
  };

  const promoteToAdmin = async () => {
    const userEmail = prompt('Enter email to promote to admin:');
    if (!userEmail) return;
    const targetUser = users.find(u => u.email === userEmail);
    if (!targetUser) return alert('User not found');
    
    await updateDoc(doc(db, 'users', targetUser.uid), { role: 'admin' });
    await setDoc(doc(db, 'admins', targetUser.uid), { uid: targetUser.uid });
    alert('User promoted to admin successfully!');
  };

  if (loading) return <div className="p-10 text-center">Loading admin data...</div>;

  return (
    <div className="min-h-screen">
      {/* High Density Admin Summary Strip */}
      <div className="bg-primary text-white py-4 border-b border-white/10 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 flex gap-12 font-bold text-xs uppercase tracking-widest">
           <div className="flex items-center gap-2">
             <span className="opacity-50">Total Workers:</span>
             <span className="text-accent">{stats.totalWorkers}</span>
           </div>
           <div className="flex items-center gap-2">
             <span className="opacity-50">Pending:</span>
             <span className="text-secondary">{stats.pendingWorkers}</span>
           </div>
           <div className="flex items-center gap-2">
             <span className="opacity-50">Total Users:</span>
             <span className="text-accent">{stats.totalUsers}</span>
           </div>
           <div className="flex items-center gap-2">
             <span className="opacity-50">Revenue:</span>
             <span className="text-accent font-black">PKR 0.00</span>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 pb-6 border-b border-high-border">
          <div>
            <h1 className="text-2xl font-black text-primary flex items-center gap-2 tracking-tight">
              <Shield className="text-secondary h-6 w-6" />
              ADMIN CONTROL PANEL
            </h1>
            <p className="text-high-muted text-xs font-semibold uppercase tracking-wider mt-1">Platform Management System</p>
          </div>

          <div className="flex bg-white border border-high-border p-1 rounded-xl shadow-sm">
            {(['stats', 'users', 'workers', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === tab ? 'bg-primary text-white shadow-md' : 'text-high-muted hover:text-primary'
                }`}
              >
                {tab}
              </button>
            ))}
            <button
              onClick={promoteToAdmin}
              className="px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider text-red-600 hover:bg-red-50 transition-all flex items-center gap-1 border-l border-high-border ml-1"
            >
              <Shield className="h-3.5 w-3.5" /> Setup
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Platform Users" value={stats.totalUsers} icon={<Users className="text-secondary" />} />
                <StatCard title="Registered Workers" value={stats.totalWorkers} icon={<Hammer className="text-accent" />} />
                <StatCard title="Active Client Accounts" value={stats.totalClients} icon={<Users className="text-blue-400" />} />
                <StatCard title="Approval Queue" value={stats.pendingWorkers} icon={<Shield className="text-red-500" />} color="border-red-100 bg-red-50/30" />
              </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              <div className="bg-white rounded-2xl border border-high-border p-6">
                <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-4">Recent Registrations</h3>
                <div className="divide-y divide-high-border">
                  {users.slice(0, 5).map(u => (
                    <div key={u.uid} className="py-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-high-bg flex items-center justify-center text-[10px] font-bold text-secondary">
                          {u.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-primary">{u.email}</p>
                          <p className="text-[10px] text-high-muted uppercase font-semibold">{u.role}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-high-muted">
                        {u.createdAt?.toDate().toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-primary rounded-2xl p-6 text-white overflow-hidden relative">
                <div className="relative z-10">
                  <h3 className="text-xs font-black text-accent uppercase tracking-widest mb-4">Platform Health</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold opacity-60">Database Ops</span>
                      <span className="text-lg font-black">{users.length + workers.length} Records</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold opacity-60">Admin Coverage</span>
                      <span className="text-lg font-black">{users.filter(u => u.role === 'admin').length} Active</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full w-full mt-2">
                       <div className="h-full bg-accent rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <p className="text-[10px] opacity-40 italic">Platform instances are running with 99.9% uptime supervisability.</p>
                  </div>
                </div>
                <LayoutDashboard className="absolute -bottom-4 -right-4 h-32 w-32 text-white/5" />
              </div>
            </div>
            </motion.div>
          )}

        {activeTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-4"
          >
            <div className="relative max-w-md mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search users by email..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredUsers.map(u => (
                    <tr key={u.uid} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{u.email}</td>
                      <td className="px-6 py-4">
                        <select 
                          value={u.role}
                          onChange={(e) => handleUpdateRole(u.uid, e.target.value)}
                          className={`px-2 py-1 rounded-lg text-xs font-bold uppercase outline-none cursor-pointer border border-transparent focus:border-secondary transition-all ${
                            u.role === 'admin' ? 'bg-red-100 text-red-600' :
                            u.role === 'worker' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                          }`}
                        >
                          <option value="client">Client</option>
                          <option value="worker">Worker</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {u.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleDeleteUser(u.uid)} className="text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'workers' && (
          <motion.div
            key="workers"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-6"
          >
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search workers by name or category..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {filteredWorkers.map(w => (
                <div key={w.uid} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row gap-6 shadow-sm overflow-hidden relative">
                  <img src={w.profileImage} alt={w.name} className="w-24 h-24 rounded-2xl object-cover shrink-0" referrerPolicy="no-referrer" />
                  
                  <div className="flex-grow space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{w.name}</h3>
                        <p className="text-blue-600 font-semibold">{w.category}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                        w.status === 'approved' ? 'bg-green-100 text-green-600' :
                        w.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        {w.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-500">
                      <div><span className="font-bold text-slate-700">Location:</span> {w.city}</div>
                      <div><span className="font-bold text-slate-700">Phone:</span> {w.phoneNumber}</div>
                      <div><span className="font-bold text-slate-700">XP:</span> {w.experience} Years</div>
                      <div><span className="font-bold text-slate-700">Approve:</span> {w.isApproved ? 'Yes' : 'No'}</div>
                    </div>
                    <button 
                      onClick={() => setEditingWorker(w)}
                      className="text-[10px] font-black text-secondary uppercase tracking-widest hover:underline"
                    >
                      Quick Edit Details
                    </button>
                  </div>

                  <div className="flex md:flex-col gap-2 items-center justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                    <button 
                      onClick={() => handleApproveWorker(w.uid)}
                      disabled={w.status === 'approved'}
                      className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl font-bold text-sm hover:bg-green-100 disabled:opacity-50 transition-colors w-full"
                    >
                      <CheckCircle className="h-4 w-4" /> Approve
                    </button>
                    <button 
                      onClick={() => handleRejectWorker(w.uid)}
                      disabled={w.status === 'rejected'}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 disabled:opacity-50 transition-colors w-full"
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl bg-white rounded-2xl border border-high-border p-8 shadow-sm space-y-6"
          >
            <div>
              <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-4">Platform General Settings</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-high-muted uppercase">Global Alert Banner (Home Page)</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-high-bg border border-high-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-secondary min-h-[100px]"
                    placeholder="Enter message to display to all users..."
                    value={globalBanner}
                    onChange={(e) => setGlobalBanner(e.target.value)}
                  />
                  <p className="text-[9px] text-high-muted">This message will appear at the top of the homepage for all visitors.</p>
                </div>
                <button 
                  onClick={handleUpdateSettings}
                  className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm hover:translate-y-[-1px] transition-all shadow-md active:translate-y-0"
                >
                  Save Platform Settings
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-high-border">
              <h3 className="text-sm font-black text-red-600 uppercase tracking-widest mb-4">Danger Zone</h3>
              <p className="text-xs text-high-muted mb-4">Administrative actions that affect platform infrastructure.</p>
              <button 
                onClick={promoteToAdmin}
                className="border border-red-200 text-red-600 px-6 py-2 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors"
              >
                Promote User to Super Admin
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Worker Modal */}
      <AnimatePresence>
        {editingWorker && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-high-border shadow-2xl w-full max-w-lg p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-primary uppercase tracking-tight">Supervise Worker Profile</h3>
                <button onClick={() => setEditingWorker(null)} className="text-high-muted hover:text-primary"><XCircle /></button>
              </div>

              <form onSubmit={handleSaveWorker} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-high-muted uppercase">Full Name</label>
                    <input 
                      className="w-full px-3 py-2 bg-high-bg border border-high-border rounded-lg text-sm outline-none"
                      value={editingWorker.name}
                      onChange={(e) => setEditingWorker({...editingWorker, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-high-muted uppercase">Category</label>
                    <input 
                      className="w-full px-3 py-2 bg-high-bg border border-high-border rounded-lg text-sm outline-none"
                      value={editingWorker.category}
                      onChange={(e) => setEditingWorker({...editingWorker, category: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-high-muted uppercase">Experience (Years)</label>
                  <input 
                    type="number"
                    className="w-full px-3 py-2 bg-high-bg border border-high-border rounded-lg text-sm outline-none"
                    value={editingWorker.experience}
                    onChange={(e) => setEditingWorker({...editingWorker, experience: parseInt(e.target.value)})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-high-muted uppercase">Public Bio</label>
                  <textarea 
                    className="w-full px-3 py-2 bg-high-bg border border-high-border rounded-lg text-sm outline-none min-h-[80px]"
                    value={editingWorker.bio}
                    onChange={(e) => setEditingWorker({...editingWorker, bio: e.target.value})}
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-grow bg-secondary text-white py-3 rounded-xl font-bold shadow-md hover:bg-secondary/90">Save Changes</button>
                  <button type="button" onClick={() => setEditingWorker(null)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">Cancel</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color = 'bg-white' }: any) => (
  <div className={`${color} p-4 rounded-xl border border-high-border shadow-sm flex items-start justify-between relative overflow-hidden group`}>
    <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
    <div>
      <p className="text-[10px] font-black text-high-muted uppercase tracking-widest mb-1">{title}</p>
      <p className="text-2xl font-black text-primary">{value}</p>
    </div>
    <div className="p-2.5 bg-high-bg border border-high-border rounded-lg group-hover:bg-secondary group-hover:text-white transition-all">
      {React.cloneElement(icon, { className: 'h-5 w-5' })}
    </div>
  </div>
);

export default AdminDashboard;
